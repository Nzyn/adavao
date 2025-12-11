DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Move Tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'alertdavao') LOOP
        EXECUTE 'ALTER TABLE alertdavao.' || quote_ident(r.tablename) || ' SET SCHEMA public';
    END LOOP;

    -- 2. Move Enums and other user-defined types
    -- We filter for types that are not arrays (typcategory != 'A') and not composite types of tables (typtype != 'c') in the schema
    FOR r IN (
        SELECT t.typname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'alertdavao'
        AND t.typtype = 'e' -- Move Enums
    ) LOOP
        EXECUTE 'ALTER TYPE alertdavao.' || quote_ident(r.typname) || ' SET SCHEMA public';
    END LOOP;
END $$;
