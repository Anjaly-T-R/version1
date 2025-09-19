-- Create the database
CREATE DATABASE IF NOT EXISTS videodb;
USE videodb;

-- Table for uploaded videos
CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner INT,
  original_name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  size BIGINT,
  runtime_sec INT,
  thumbnail_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for transcode jobs
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  preset VARCHAR(50) NOT NULL,
  status ENUM('queued','processing','done','error') DEFAULT 'queued',
  progress INT DEFAULT 0,
  cpu_avg FLOAT,
  started_at DATETIME,
  finished_at DATETIME,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);
