/**
 * Relationship Validation Utilities
 * 
 * Provides runtime validation for InstantDB entity relationships
 * to prevent orphaned records and ensure data integrity.
 */

import { Profile } from "@/types";

/**
 * Validates that a profile exists and has a valid ID
 * @throws Error if profile is null/undefined or has invalid ID
 */
export function validateProfile(profile: Profile | null | undefined): asserts profile is Profile {
  if (!profile) {
    throw new Error("Profile is required but was not found. User may need to complete onboarding.");
  }
  
  if (!profile.id || profile.id.trim() === "") {
    throw new Error("Profile ID is invalid or empty");
  }
}

/**
 * Safely gets a profile ID, returning null if invalid
 * Use this for defensive checks before linking
 */
export function safeGetProfileId(profile: Profile | null | undefined): string | null {
  if (!profile?.id || profile.id.trim() === "") {
    return null;
  }
  return profile.id;
}

/**
 * Validates that an entity ID exists and is valid
 * @throws Error if ID is null/undefined/empty
 */
export function validateEntityId(id: string | null | undefined, entityType: string): asserts id is string {
  if (!id || id.trim() === "") {
    throw new Error(`${entityType} ID is required but was empty or invalid`);
  }
}

/**
 * Validates parent-child relationship IDs
 * Used for debt_payments → debt and savings_contributions → goal
 */
export function validateParentId(
  parentId: string | null | undefined,
  parentType: "debt" | "goal"
): asserts parentId is string {
  if (!parentId || parentId.trim() === "") {
    throw new Error(`Parent ${parentType} ID is required but was empty or invalid`);
  }
}

/**
 * Safe wrapper for profile-linked entity creation
 * Returns whether the operation should proceed
 */
export function canCreateProfileLinkedEntity(profile: Profile | null | undefined): boolean {
  try {
    validateProfile(profile);
    return true;
  } catch (error) {
    console.error("Cannot create entity - invalid profile:", error);
    return false;
  }
}

/**
 * Relationship validation errors with helpful messages
 */
export class RelationshipValidationError extends Error {
  constructor(
    public entityType: string,
    public linkType: string,
    public details: string
  ) {
    super(`Failed to validate ${linkType} relationship for ${entityType}: ${details}`);
    this.name = "RelationshipValidationError";
  }
}

/**
 * Validates budget creation which requires BOTH profile and category
 */
export function validateBudgetRelationships(
  profile: Profile | null | undefined,
  categoryId: string | null | undefined
): { profileId: string; categoryId: string } {
  validateProfile(profile);
  validateEntityId(categoryId, "Category");
  
  return {
    profileId: profile.id,
    categoryId: categoryId!,
  };
}

/**
 * Type guard to check if profile has required fields
 */
export function isValidProfile(profile: unknown): profile is Profile {
  return (
    typeof profile === "object" &&
    profile !== null &&
    "id" in profile &&
    typeof (profile as Profile).id === "string" &&
    (profile as Profile).id.trim() !== ""
  );
}

/**
 * Development mode validation (more strict, throws errors)
 * Production mode validation (logs warnings, allows operation)
 */
export function validateProfileForLink(
  profile: Profile | null | undefined,
  entityType: string,
  strict = process.env.NODE_ENV === "development"
): string | null {
  const profileId = safeGetProfileId(profile);
  
  if (!profileId) {
    const message = `Attempting to create ${entityType} without valid profile`;
    
    if (strict) {
      throw new RelationshipValidationError(entityType, "profile", "Profile is null or has invalid ID");
    } else {
      console.warn(`⚠️ ${message} - entity may be orphaned`);
      return null;
    }
  }
  
  return profileId;
}

/**
 * Batch validation for multiple entity creations
 */
export function validateBatchProfileLinks(
  profile: Profile | null | undefined,
  entityTypes: string[]
): { valid: boolean; profileId: string | null; errors: string[] } {
  const errors: string[] = [];
  const profileId = safeGetProfileId(profile);
  
  if (!profileId) {
    errors.push(`Profile is invalid or missing for batch creation of: ${entityTypes.join(", ")}`);
    return { valid: false, profileId: null, errors };
  }
  
  return { valid: true, profileId, errors: [] };
}

/**
 * Helper to ensure profile exists before bulk operations
 */
export function assertProfileExists(
  profile: Profile | null | undefined,
  operationDescription: string
): asserts profile is Profile {
  if (!profile?.id || profile.id.trim() === "") {
    throw new Error(
      `Cannot ${operationDescription}: User profile not found. Please complete onboarding first.`
    );
  }
}
