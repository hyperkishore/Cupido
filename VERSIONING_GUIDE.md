# Cupido Versioning Guide

## Version Format: `major.minor.patch`

### Current Version Calculation
The version is automatically calculated based on git commit count in `src/components/VersionDisplay.tsx`.

## Versioning Rules

### Patch Version (x.x.Z)
**Increment for minor changes:**
- Bug fixes
- UI tweaks  
- Text changes
- Style adjustments
- Performance improvements
- Documentation updates

### Minor Version (x.Y.x)
**Increment for feature updates:**
- New features added
- New screens or components
- API integrations
- Database schema changes
- Significant UI/UX improvements
- Breaking changes to existing features

### Major Version (X.x.x)
**Increment for major releases:**
- Complete redesigns
- Architecture changes
- Platform changes
- After 9 minor version increments (automatically goes from 1.9.x to 2.0.0)

## Commit Process

Before each commit, please confirm:

1. **Change Type**: Is this a patch (minor fix) or minor (feature) change?
2. **Version Update**: The version will auto-increment based on commit count
3. **Commit Message**: Clear description of changes
4. **Testing**: Have the changes been tested on mobile Safari?

## Current Version Tracking

- Version is displayed in the app header
- Automatically increments with each commit
- Based on total commit count in the repository

## Manual Override

If you need to set a specific version, update the `CURRENT_COMMIT_COUNT` in:
```
src/components/VersionDisplay.tsx
```