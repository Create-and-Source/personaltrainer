import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const ddb = DynamoDBDocumentClient.from(client);

export async function queryItems(tableName, keyCondition, expressionValues, indexName) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
  };
  if (indexName) params.IndexName = indexName;
  const result = await ddb.send(new QueryCommand(params));
  return result.Items || [];
}

export async function getItem(tableName, key) {
  const result = await ddb.send(new GetCommand({ TableName: tableName, Key: key }));
  return result.Item || null;
}

export async function putItem(tableName, item) {
  await ddb.send(new PutCommand({ TableName: tableName, Item: item }));
  return item;
}

export async function deleteItem(tableName, key) {
  await ddb.send(new DeleteCommand({ TableName: tableName, Key: key }));
}

export async function updateItem(tableName, key, updates) {
  const expressions = [];
  const names = {};
  const values = {};
  Object.entries(updates).forEach(([k, v], i) => {
    expressions.push(`#f${i} = :v${i}`);
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });
  await ddb.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function scanAll(tableName) {
  const result = await ddb.send(new ScanCommand({ TableName: tableName }));
  return result.Items || [];
}
