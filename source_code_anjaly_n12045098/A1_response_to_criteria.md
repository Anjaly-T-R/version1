Assignment 1 - REST API Project - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Anjaly Thelekkat Rajan
- **Student number:** n12045098
- **Application name:** y_mini_app(Youtube mini app)
- **Two line description:** This REST API help to users to upload media, listing videos with pagination and submitting CPU intensive ffmpeg transcode jobs using a Node/Express.
JWT using for authentication and data stored in mariadb. Containerised and deployed  from ECR to EC2.


Core criteria
------------------------------------------------

### Containerise the app

- **ECR Repository name:** n12045098-y-mini-api
- **Video timestamp:** 04:40
- **Relevant files:**
    - dockerfile
    - package.json, package-lock.json

### Deploy the container

- **EC2 instance ID:** i-0365732378b301ac0
- **Video timestamp:** 0:001-0:003

### User login

- **One line description:** it focus role based user access and protect all endpoints via JWT token
- **Video timestamp:** 01:32
- **Relevant files:**
    - app.js
    - src/routes/auth.js
    - src/controllers/auth.js

### REST API

- **One line description:** two endpoints videos and jobs with PUT, GET, POST http methods as well
- **Video timestamp:** 01:41-03:00, 04:05-04:10
- **Relevant files:**
    - app.js
    - src/routes/
        - index.js
        - videos.js
        - jobs.js
    - src/controllers
        - jobs.js
        - videos.js

### Data types

- **One line description:** store video files and metadata also processing jobs in mariadb upload file under folder data
- **Video timestamp:** 04:00
- **Relevant files:**
    - schema.sql

#### First kind

- **One line description:** upload media and audio with metadata
- **Type:** unstructured
- **Rationale:** handling video or audio bunary data and linking structured meta data by linking db for queries and pagination.
- **Video timestamp:** 01:46-02:09
- **Relevant files:**
    - schema.sql
    - src/controller/video.js
    - src/routes/videos.js
    - data/uploads

#### Second kind

- **One line description:** transcoding job records
- **Type:** structured 
- **Rationale:** the system is recover, audit, and reliably track long term run because of consistent and durable for status, cpu usage,and progress
- **Video timestamp:** 02:30-02:51
- **Relevant files:**
  - schema.sql
  - src/jobs/transcode.js
  - src/controllers/jobs.js

### CPU intensive task

 **One line description:** ffmpeg transcode triggered via job
- **Video timestamp:** 02:40-02:52
- **Relevant files:**
    - dockerfile
    - src/jobs/transcode.js
    - src/controllers/jobs.js

### CPU load testing

 **One line description:** i triggered a CPU burst using a command line loop with background job and monitor CPU usage by monitor tab.
- **Video timestamp:** 03:06-03:58
- **Relevant files:**
    - src/loadtest

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** pagination and limit
- **Video timestamp:** 03:01
- **Relevant files:** 
    - src/model/videos.js

### External API(s)

- **One line description:** partially
- **Video timestamp:**
- **Relevant files:**
    - services/enrich.js

### Additional types of data

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Custom processing

- **One line description:** additional ffmpeg presets
- **Video timestamp:** 04:00
- **Relevant files:**
    - data/uploads

### Infrastructure as code

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Web client

- **One line description:** demostrated extrenal webclient as hoppscotch
- **Video timestamp:** 01:17
- **Relevant files:**
    -   

### Upon request

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 