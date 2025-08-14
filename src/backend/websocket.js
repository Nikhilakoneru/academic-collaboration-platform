const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME;

// same response helper again...
const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  const { requestContext, body } = event;
  const { routeKey, connectionId, domainName, stage } = requestContext;
  
  // need this to send messages back to connected clients
  const endpoint = `https://${domainName}/${stage}`;
  const apigateway = new ApiGatewayManagementApiClient({ 
    endpoint,
    region: process.env.AWS_REGION 
  });
  
  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId);
      case '$disconnect':
        return await handleDisconnect(connectionId);
      case '$default':
        return await handleMessage(connectionId, JSON.parse(body), apigateway);
      default:
        return response(404, { error: 'Route not found' });
    }
  } catch (error) {
    return response(500, { error: 'Internal server error' });
  }
};

async function handleConnect(connectionId) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `CONN#${connectionId}`,
      SK: 'METADATA',
      connectionId,
      connectedAt: new Date().toISOString()
    }
  });
  
  await dynamodb.send(command);
  
  // TODO: add TTL to auto-cleanup dead connections
  return response(200, { message: 'Connected' });
}
async function handleDisconnect(connectionId) {
  const deleteCommand = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CONN#${connectionId}`,
      SK: 'METADATA'
    }
  });
  
  await dynamodb.send(deleteCommand);
  
  // Remove from any documents
  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `CONN#${connectionId}`
    }
  });
  
  const docs = await dynamodb.send(queryCommand);
  
  for (const doc of docs.Items || []) {
    const deleteDocCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: doc.PK,
        SK: doc.SK
      }
    });
    await dynamodb.send(deleteDocCommand);
  }
  
  return response(200, { message: 'Disconnected' });
}

async function handleMessage(connectionId, message, apigateway) {
  const { action, documentId, data } = message;
  
  switch (action) {
    case 'JOIN_DOCUMENT':
      return await joinDocument(connectionId, documentId, apigateway);
    case 'LEAVE_DOCUMENT':
      return await leaveDocument(connectionId, documentId);
    case 'DOCUMENT_UPDATE':
      return await broadcastUpdate(connectionId, documentId, data, apigateway);
    default:
      return response(400, { error: 'Unknown action' });
  }
}

async function joinDocument(connectionId, documentId, apigateway) {
  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `DOC#${documentId}`,
      SK: `CONN#${connectionId}`,
      GSI1PK: `CONN#${connectionId}`,
      GSI1SK: `DOC#${documentId}`,
      connectionId,
      documentId,
      joinedAt: new Date().toISOString()
    }
  });
  
  await dynamodb.send(putCommand);
  
  await sendToConnection(connectionId, {
    action: 'JOINED_DOCUMENT',
    documentId
  }, apigateway);
  
  return response(200, { message: 'Joined document' });
}
async function leaveDocument(connectionId, documentId) {
  const deleteCommand = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `DOC#${documentId}`,
      SK: `CONN#${connectionId}`
    }
  });
  
  await dynamodb.send(deleteCommand);
  
  return response(200, { message: 'Left document' });
}

async function broadcastUpdate(connectionId, documentId, data, apigateway) {
  // Get all connections for this document
  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `DOC#${documentId}`,
      ':sk': 'CONN#'
    }
  });
  
  const connections = await dynamodb.send(queryCommand);
  
  // Broadcast to all connections except sender
  const promises = (connections.Items || [])
    .filter(item => item.connectionId !== connectionId)
    .map(item => sendToConnection(item.connectionId, {
      action: 'DOCUMENT_UPDATE',
      documentId,
      data
    }, apigateway));
  
  await Promise.allSettled(promises);
  
  return response(200, { message: 'Update broadcast' });
}

async function sendToConnection(connectionId, data, apigateway) {
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(data)
    });
    
    await apigateway.send(command);
  } catch (error) {
    if (error.statusCode === 410) {
      // Connection no longer exists, clean up
      await handleDisconnect(connectionId);
    }
    throw error;
  }
}