-- Historical seed rows were previously auto-approved with modeled authority
-- and link-attribute values. Remove those claims from every seed row. Only
-- never-reviewed rows return to `new`; genuine human review state is retained.
UPDATE `backlinkOpportunities`
SET
  `discoveredVia` = 'legacy_unverified_seed',
  `relevanceScore` = NULL,
  `relevanceReason` = 'Unverified research candidate; confirm the site, editorial fit, submission policy, pricing, and link attributes before approval.',
  `domainAuthority` = NULL,
  `doFollow` = NULL,
  `status` = CASE
    WHEN `reviewedAt` IS NULL AND TRIM(COALESCE(`reviewNotes`, '')) = '' THEN 'new'
    ELSE `status`
  END,
  `reviewNotes` = CASE
    WHEN `reviewedAt` IS NULL AND TRIM(COALESCE(`reviewNotes`, '')) = '' THEN NULL
    ELSE `reviewNotes`
  END
WHERE `discoveredVia` = 'initial seed';
