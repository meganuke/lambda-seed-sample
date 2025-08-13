-- step 1: create a new user role and database
CREATE ROLE lambda_seed_user WITH LOGIN NOSUPERUSER INHERIT CREATEDB NOCREATEROLE NOREPLICATION PASSWORD '123456'; 
GRANT lambda_seed_user TO postgres;

-- step 2: create the database
CREATE DATABASE lambda_pod_db WITH OWNER = lambda_seed_user ENCODING = 'UTF8' CONNECTION LIMIT = -1;

-- step 3: connect to the database and create the uuid function
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

-- step 4: create the user table
CREATE TABLE user
(
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  name JSONB,
  email TEXT UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE IF EXISTS public.user
  OWNER to lambda_seed_user;