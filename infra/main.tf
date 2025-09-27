provider "aws" {
  region = "ap-southeast-2"
}

# --------------------------
# 1. S3 Bucket (WORKS ✅)
# --------------------------
resource "aws_s3_bucket" "videos" {
  bucket = "n12045098-mini-youtube-app"
}

# --------------------------
# 2. Parameter Store (Cognito Client ID ✅)
# --------------------------
resource "aws_ssm_parameter" "cognito_client_id" {
  name  = "/n12045098/cognito-client-id"
  type  = "String"
  value = "43d7dmr0mafg971ia251vi8vg6"   # real client ID
}

# --------------------------
# 3. Secrets Manager (DB user + password ❌ IAM may block, but config correct)
# --------------------------
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "group40/postgres-credentials"
  description = "Postgres DB credentials for mini YouTube app"
}

resource "aws_secretsmanager_secret_version" "db_credentials_value" {
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "s408"
    password = "FPzoBUiC7eTX"
  })
}

# --------------------------
# 4. RDS PostgreSQL (❌ IAM restricted, kept for evidence)
# --------------------------
# resource "aws_db_instance" "appdb" {
#   allocated_storage    = 20
#   engine               = "postgres"
#   engine_version       = "15.3"
#   instance_class       = "db.t3.micro"
#   db_name              = "cohort_2025"
#   username             = "s408"
#   password             = "FPzoBUiC7eTX"
#   skip_final_snapshot  = true
#   publicly_accessible  = true
#   port                 = 5432
# }

# --------------------------
# Outputs (useful for assignment evidence)
# --------------------------
output "s3_bucket_name" {
  value = aws_s3_bucket.videos.bucket
}

output "cognito_client_id_param" {
  value = aws_ssm_parameter.cognito_client_id.name
}

output "db_secret" {
  value = aws_secretsmanager_secret.db_credentials.name
}

# output "rds_endpoint" {
#   value = aws_db_instance.appdb.address
# }

