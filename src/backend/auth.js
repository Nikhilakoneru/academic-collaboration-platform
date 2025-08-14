const { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, GetUserCommand, AdminConfirmSignUpCommand, UpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

// TODO: move this to utils, duplicated everywhere
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;
  
  try {
    if (path.includes('/login') && method === 'POST') {
      return await handleLogin(JSON.parse(event.body));
    } else if (path.includes('/signup') && method === 'POST') {
      return await handleSignup(JSON.parse(event.body));
    } else if (path.includes('/verify') && method === 'GET') {
      return await handleVerify(event.headers.Authorization);
    } else if (path.includes('/profile') && method === 'PUT') {
      return await handleUpdateProfile(event.headers.Authorization, JSON.parse(event.body));
    }
    
    return response(404, { error: 'Not found' });
  } catch (error) {
    return response(500, { error: 'Internal server error' });
  }
};
async function handleLogin(body) {
  const { email, password } = body;
  
  if (!email || !password) {
    return response(400, { error: 'Email and password required' });
  }
  
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const authResult = await cognitoClient.send(command);
    
    return response(200, {
      token: authResult.AuthenticationResult.AccessToken,
      idToken: authResult.AuthenticationResult.IdToken,
      refreshToken: authResult.AuthenticationResult.RefreshToken,
      expiresIn: authResult.AuthenticationResult.ExpiresIn
    });
  } catch (error) {
    return response(401, { error: 'Invalid credentials' });
  }
}

async function handleSignup(body) {
  const { email, password, name } = body;
  
  if (!email || !password || !name) {
    return response(400, { error: 'Email, password, and name required' });
  }
  
  try {
    const signupCommand = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name }
      ]
    });
    
    const signupResult = await cognitoClient.send(signupCommand);
    
    // skip email verification in dev
    if (process.env.AUTO_CONFIRM_USERS === 'true') {
      const confirmCommand = new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: email
      });
      await cognitoClient.send(confirmCommand);
    }
    
    // Store user in DynamoDB
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${signupResult.UserSub}`,
        SK: 'METADATA',
        email,
        name,
        createdAt: new Date().toISOString()
      }
    });
    
    await dynamodb.send(putCommand);
    
    return response(201, {
      userId: signupResult.UserSub,
      message: process.env.AUTO_CONFIRM_USERS === 'true' 
        ? 'User created and auto-confirmed (dev mode)' 
        : 'User created successfully. Please check your email for verification.'
    });
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      return response(409, { error: 'User already exists' });
    }
    return response(400, { error: error.message });
  }
}
async function handleVerify(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response(401, { error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const command = new GetUserCommand({
      AccessToken: token
    });
    
    const result = await cognitoClient.send(command);
    
    const userId = result.UserAttributes.find(attr => attr.Name === 'sub').Value;
    const email = result.UserAttributes.find(attr => attr.Name === 'email').Value;
    const name = result.UserAttributes.find(attr => attr.Name === 'name').Value;
    
    return response(200, {
      userId,
      email,
      name,
      username: result.Username
    });
  } catch (error) {
    return response(401, { error: 'Invalid token' });
  }
}

async function handleUpdateProfile(authHeader, body) {
  const { name } = body;
  
  // Validate auth token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response(401, { error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Update user attributes in Cognito
    const command = new UpdateUserAttributesCommand({
      AccessToken: token,
      UserAttributes: [
        { Name: 'name', Value: name }
      ]
    });
    
    await cognitoClient.send(command);
    
    // Also update in DynamoDB if user exists there
    const getUserCommand = new GetUserCommand({
      AccessToken: token
    });
    const userResult = await cognitoClient.send(getUserCommand);
    const userId = userResult.UserAttributes.find(attr => attr.Name === 'sub').Value;
    
    // Update user record in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET #name = :name',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name
      }
    });
    
    await dynamodb.send(updateCommand);
    
    return response(200, {
      message: 'Profile updated successfully',
      name: name
    });
  } catch (error) {
    return response(500, { error: 'Failed to update profile' });
  }
}