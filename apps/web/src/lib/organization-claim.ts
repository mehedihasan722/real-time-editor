type IdentityClaims = Record<string, unknown>;

export const getActiveOrganizationId = (identity: IdentityClaims) => {
  if (typeof identity.org_id === "string") return identity.org_id;
  if (typeof identity.orgId === "string") return identity.orgId;
  if (typeof identity.organization_id === "string") return identity.organization_id;

  const organization = identity.o;
  if (
    organization &&
    typeof organization === "object" &&
    !Array.isArray(organization) &&
    typeof (organization as Record<string, unknown>).id === "string"
  ) {
    return (organization as Record<string, unknown>).id as string;
  }

  return null;
};
