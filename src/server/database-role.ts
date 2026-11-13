export type RuntimeDatabaseIdentity = {
  database: string; username: string; unsafe_role: boolean; owns_objects: boolean; can_create: boolean;
};
export function assertRuntimeDatabaseIdentity(identity: RuntimeDatabaseIdentity, expectedDatabase: string, expectedUser: string) {
  if (!identity || identity.database !== expectedDatabase || identity.username !== expectedUser || identity.unsafe_role !== false || identity.owns_objects !== false || identity.can_create !== false) {
    throw new Error("Hosted runtime database identity or privilege check failed.");
  }
}
// Read-only catalog inspection; elevated inherited memberships are rejected too.
export const runtimeIdentityQuery = `SELECT current_database() AS database, current_user AS username,
  EXISTS (SELECT 1 FROM pg_roles r WHERE pg_has_role(current_user, r.oid, 'MEMBER')
    AND (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls)) AS unsafe_role,
  EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND pg_has_role(current_user,c.relowner,'MEMBER')) AS owns_objects,
  (has_schema_privilege(current_user,'public','CREATE') OR has_database_privilege(current_user,current_database(),'CREATE')) AS can_create`;
