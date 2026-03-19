#!/bin/bash
set -e

REGION="us-west-2"
ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/forge-pt-lambda-role"
RUNTIME="nodejs20.x"
S3_BUCKET="forge-pt-uploads"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/.build"

# Lambda definitions: name | handler file | table name
LAMBDAS=(
  "forge-pt-clients|lambdas/clients.mjs|forge-pt-clients"
  "forge-pt-sessions|lambdas/sessions.mjs|forge-pt-sessions"
  "forge-pt-programs|lambdas/programs.mjs|forge-pt-programs"
  "forge-pt-progress|lambdas/progress.mjs|forge-pt-progress"
  "forge-pt-nutrition|lambdas/nutrition.mjs|forge-pt-nutrition"
  "forge-pt-habits|lambdas/habits.mjs|forge-pt-habits"
  "forge-pt-messages|lambdas/messages.mjs|forge-pt-messages"
  "forge-pt-workouts|lambdas/workouts.mjs|forge-pt-workouts"
  "forge-pt-memberships|lambdas/memberships.mjs|forge-pt-memberships"
  "forge-pt-settings|lambdas/settings.mjs|forge-pt-settings"
  "forge-pt-auth|lambdas/auth.mjs|"
  "forge-pt-presign|lambdas/presign.mjs|"
)

echo "=== Forge PT Lambda Deploy ==="
echo "Region: $REGION"
echo ""

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

deploy_lambda() {
  local NAME="$1"
  local HANDLER_FILE="$2"
  local TABLE_NAME="$3"

  echo "--- Deploying $NAME ---"

  local ZIP_DIR="$BUILD_DIR/$NAME"
  mkdir -p "$ZIP_DIR/shared"

  # Copy handler and shared modules
  cp "$SCRIPT_DIR/$HANDLER_FILE" "$ZIP_DIR/"
  cp "$SCRIPT_DIR/shared/"*.mjs "$ZIP_DIR/shared/"

  # Create zip
  local ZIP_PATH="$BUILD_DIR/$NAME.zip"
  (cd "$ZIP_DIR" && zip -r "$ZIP_PATH" . -q)

  # Build environment variables
  local ENV_VARS="{\"Variables\":{\"NODE_OPTIONS\":\"--enable-source-maps\""
  if [ -n "$TABLE_NAME" ]; then
    ENV_VARS="$ENV_VARS,\"TABLE_NAME\":\"$TABLE_NAME\""
  fi
  if [ "$NAME" = "forge-pt-presign" ]; then
    ENV_VARS="$ENV_VARS,\"S3_BUCKET\":\"$S3_BUCKET\""
  fi
  ENV_VARS="$ENV_VARS}}"

  # Determine handler path (filename without .mjs + .handler)
  local HANDLER_BASE
  HANDLER_BASE=$(basename "$HANDLER_FILE" .mjs)
  local HANDLER="$HANDLER_BASE.handler"

  # Check if function exists
  if aws lambda get-function --function-name "$NAME" --region "$REGION" &>/dev/null; then
    echo "  Updating existing function..."
    aws lambda update-function-code \
      --function-name "$NAME" \
      --zip-file "fileb://$ZIP_PATH" \
      --region "$REGION" \
      --no-cli-pager

    # Wait for update to complete before updating config
    aws lambda wait function-updated --function-name "$NAME" --region "$REGION" 2>/dev/null || true

    aws lambda update-function-configuration \
      --function-name "$NAME" \
      --runtime "$RUNTIME" \
      --handler "$HANDLER" \
      --environment "$ENV_VARS" \
      --timeout 30 \
      --memory-size 256 \
      --region "$REGION" \
      --no-cli-pager
  else
    echo "  Creating new function..."
    aws lambda create-function \
      --function-name "$NAME" \
      --runtime "$RUNTIME" \
      --role "$ROLE_ARN" \
      --handler "$HANDLER" \
      --zip-file "fileb://$ZIP_PATH" \
      --environment "$ENV_VARS" \
      --timeout 30 \
      --memory-size 256 \
      --region "$REGION" \
      --no-cli-pager
  fi

  echo "  Done: $NAME"
  echo ""
}

# Deploy each Lambda
for ENTRY in "${LAMBDAS[@]}"; do
  IFS='|' read -r NAME FILE TABLE <<< "$ENTRY"
  deploy_lambda "$NAME" "$FILE" "$TABLE"
done

# Clean up
rm -rf "$BUILD_DIR"

echo "=== All Lambda functions deployed ==="
