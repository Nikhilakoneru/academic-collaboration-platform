const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CognitoIdentityProviderClient, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({ region: process.env.AWS_REGION });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TABLE_NAME;
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET;
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

// duplicated from auth.js, refactor later
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  // Verify user
  const user = await verifyUser(authHeader);
  if (!user) {
    return response(401, { error: 'Unauthorized' });
  }
  
  try {
    // Handle both /documents and /dev/documents paths
    const normalizedPath = path.replace(/^\/dev/, '');
    
    if (normalizedPath === '/documents' && method === 'GET') {
      return await listDocuments(user.userId, user.email);
    } else if (normalizedPath === '/documents' && method === 'POST') {
      return await createDocument(user.userId, JSON.parse(event.body));
    } else if (normalizedPath.match(/\/documents\/[\w-]+/) && method === 'POST' && event.queryStringParameters?.action === 'share') {
      const docId = normalizedPath.split('/')[2];
      return await shareDocument(user.userId, user.email, docId, JSON.parse(event.body));
    } else if (normalizedPath.match(/\/documents\/[\w-]+/) && method === 'GET') {
      const docId = normalizedPath.split('/')[2];
      return await getDocument(user.userId, user.email, docId);
    } else if (normalizedPath.match(/\/documents\/[\w-]+/) && method === 'PUT') {
      const docId = normalizedPath.split('/')[2];
      return await updateDocument(user.userId, user.email, docId, JSON.parse(event.body));
    } else if (normalizedPath.match(/\/documents\/[\w-]+/) && method === 'DELETE') {
      const docId = normalizedPath.split('/')[2];
      return await deleteDocument(user.userId, docId);
    }
    
    return response(404, { error: 'Not found' });
  } catch (error) {
    return response(500, { error: 'Internal server error', details: error.message });
  }
};

async function verifyUser(authHeader) {
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const command = new GetUserCommand({
      AccessToken: token
    });
    const result = await cognito.send(command);
    
    return {
      userId: result.UserAttributes.find(attr => attr.Name === 'sub').Value,
      email: result.UserAttributes.find(attr => attr.Name === 'email').Value
    };
  } catch (error) {
    return null;
  }
}

async function listDocuments(userId, userEmail) {
  try {
    // Get owned documents
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`
      }
    });
    
    const result = await dynamodb.send(command);
    
    // Documents have SK: 'METADATA' and GSI1SK starts with 'DOC#'
    const ownedDocuments = result.Items ? result.Items.filter(item => 
      item.SK === 'METADATA' && 
      item.GSI1SK && 
      item.GSI1SK.startsWith('DOC#')
    ).map(doc => ({...doc, isOwned: true})) : [];
    
    // this is slow but works for now
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(PK, :docPrefix) AND SK = :sk',
      ExpressionAttributeValues: {
        ':docPrefix': 'DOC#',
        ':sk': 'METADATA'
      }
    });
    
    const allDocs = await dynamodb.send(scanCommand);
    
    // Filter for documents shared with this user's email
    const sharedDocuments = allDocs.Items ? allDocs.Items.filter(doc => 
      doc.sharedWith && doc.sharedWith.includes(userEmail)
    ).map(doc => ({...doc, isShared: true})) : [];
    
    // Combine owned and shared documents
    const allDocuments = [...ownedDocuments, ...sharedDocuments];
    
    // Remove duplicates (in case a document is both owned and shared)
    const uniqueDocuments = allDocuments.reduce((acc, doc) => {
      const existingIndex = acc.findIndex(d => d.docId === doc.docId);
      if (existingIndex === -1) {
        acc.push(doc);
      } else if (doc.isOwned) {
        // If duplicate, prefer the owned version
        acc[existingIndex] = doc;
      }
      return acc;
    }, []);
    
    return response(200, { documents: uniqueDocuments });
  } catch (error) {
    return response(500, { error: 'Failed to list documents', details: error.message });
  }
}

async function createDocument(userId, body) {
  const { title, content = '' } = body;
  
  if (!title) {
    return response(400, { error: 'Title required' });
  }
  
  const docId = uuidv4();
  const timestamp = new Date().toISOString();
  
  const document = {
    PK: `DOC#${docId}`,
    SK: 'METADATA',
    GSI1PK: `USER#${userId}`,
    GSI1SK: `DOC#${docId}`,
    docId,
    title,
    content,
    ownerId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1
  };
  
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: document
  });
  
  await dynamodb.send(command);
  
  return response(201, { document });
}
async function getDocument(userId, userEmail, docId) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${docId}`,
      SK: 'METADATA'
    }
  });
  
  const result = await dynamodb.send(command);
  
  if (!result.Item) {
    return response(404, { error: 'Document not found' });
  }
  
  // make sure user can actually see this doc
  if (result.Item.ownerId !== userId && !result.Item.sharedWith?.includes(userEmail)) {
    return response(403, { error: 'Access denied' });
  }
  
  return response(200, { document: result.Item });
}

async function updateDocument(userId, userEmail, docId, body) {
  const { title, content } = body;
  
  // Get current document
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${docId}`,
      SK: 'METADATA'
    }
  });
  
  const currentDoc = await dynamodb.send(getCommand);
  
  if (!currentDoc.Item) {
    return response(404, { error: 'Document not found' });
  }
  
  // both owner and shared users can edit
  if (currentDoc.Item.ownerId !== userId && !currentDoc.Item.sharedWith?.includes(userEmail)) {
    return response(403, { error: 'You do not have permission to update this document' });
  }
  
  const updateExpression = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};
  
  if (title !== undefined) {
    updateExpression.push('#title = :title');
    expressionAttributeNames['#title'] = 'title';
    expressionAttributeValues[':title'] = title;
  }
  
  if (content !== undefined) {
    updateExpression.push('#content = :content');
    expressionAttributeNames['#content'] = 'content';
    expressionAttributeValues[':content'] = content;
  }
  
  updateExpression.push('updatedAt = :updatedAt');
  updateExpression.push('version = version + :inc');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeValues[':inc'] = 1;
  
  const updateCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${docId}`,
      SK: 'METADATA'
    },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length ? expressionAttributeNames : undefined,
    ReturnValues: 'ALL_NEW'
  });
  
  await dynamodb.send(updateCommand);
  
  return response(200, { message: 'Document updated' });
}
async function deleteDocument(userId, docId) {
  // Check ownership
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${docId}`,
      SK: 'METADATA'
    }
  });
  
  const doc = await dynamodb.send(getCommand);
  
  if (!doc.Item) {
    return response(404, { error: 'Document not found' });
  }
  
  if (doc.Item.ownerId !== userId) {
    return response(403, { error: 'Only owner can delete' });
  }
  
  // Delete document
  const deleteCommand = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${docId}`,
      SK: 'METADATA'
    }
  });
  
  await dynamodb.send(deleteCommand);
  
  // Delete from S3 if exists
  try {
    const s3Command = new DeleteObjectCommand({
      Bucket: DOCUMENTS_BUCKET,
      Key: `documents/${docId}/`
    });
    await s3.send(s3Command);
  } catch (error) {
    // Silently ignore S3 errors as they're non-critical
  }
  
  return response(200, { message: 'Document deleted' });
}

async function shareDocument(userId, userEmail, docId, body) {
  const { email } = body;
  
  if (!email) {
    return response(400, { error: 'Email required' });
  }
  
  // Get document
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: { 
      PK: `DOC#${docId}`, 
      SK: 'METADATA' 
    }
  });
  
  const doc = await dynamodb.send(getCommand);
  
  if (!doc.Item) {
    return response(404, { error: 'Document not found' });
  }
  
  // Only owner can share
  if (doc.Item.ownerId !== userId) {
    return response(403, { error: 'Only owner can share documents' });
  }
  
  // Don't allow sharing with yourself
  if (email === userEmail) {
    return response(400, { error: 'Cannot share with yourself' });
  }
  
  // Get current shared list (store emails directly for simplicity)
  const sharedWith = doc.Item.sharedWith || [];
  
  // Check if already shared
  if (sharedWith.includes(email)) {
    return response(200, { message: 'Document already shared with this user' });
  }
  
  // Update document with new shared user
  const updateCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { 
      PK: `DOC#${docId}`, 
      SK: 'METADATA' 
    },
    UpdateExpression: 'SET sharedWith = :emails',
    ExpressionAttributeValues: {
      ':emails': [...sharedWith, email]
    }
  });
  
  await dynamodb.send(updateCommand);
  
  return response(200, { 
    message: 'Document shared successfully',
    sharedWith: email 
  });
}