import { describe, expect, it } from "vitest";
import { emptyProfileFormValues, profileSchema } from "@/features/profile/profile.schema";

describe("profileSchema", () => {
  it("accepts a complete zero-baseline profile", () => {
    expect(profileSchema.safeParse(emptyProfileFormValues).success).toBe(true);
  });

  it("rejects impossible percentages", () => {
    const result = profileSchema.safeParse({
      ...emptyProfileFormValues,
      electricity: {
        monthlyKwh: 200,
        renewablePercent: 120,
      },
    });

    expect(result.success).toBe(false);
  });
});
