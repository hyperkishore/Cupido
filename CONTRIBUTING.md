# Contributing to Cupido

Thank you for your interest in contributing to Cupido! This guide will help you get started.

## Development Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd cupido
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development**
   ```bash
   npm start          # Standard mode
   EXPO_DEBUG=true npm start  # Debug mode
   ```

## Code Standards

### TypeScript
- All new code must be TypeScript
- Enable strict mode in tsconfig.json
- Use proper type definitions
- Avoid `any` type

### Design System
- Follow Apple/Airbnb design principles
- **Two-color palette only**: Black (#000000) and White (#FFFFFF)
- **No emojis**: Use clean text and flat icons
- **Generous whitespace**: Maintain clarity and focus
- **System fonts**: Use default platform typography

### Component Guidelines

#### Screen Components
- Use **PixelPerfect*** prefix for production screens
- Include TypeScript interfaces for props
- Follow consistent layout patterns
- Implement proper error boundaries

#### Naming Conventions
```typescript
// Good: Clear, descriptive names
interface ReflectionData {
  id: string;
  content: string;
  createdAt: Date;
}

// Bad: Unclear abbreviations
interface RefData {
  i: string;
  c: string;
  ca: Date;
}
```

#### File Structure
```
src/
├── components/
│   ├── ComponentName.tsx      # Main component
│   ├── ComponentName.test.tsx # Unit tests
│   └── index.ts              # Export barrel
├── screens/
│   └── FeatureName/
│       ├── FeatureScreen.tsx
│       ├── components/
│       └── hooks/
```

### Styling
- Use StyleSheet.create() for React Native styles
- Group related styles together
- Use semantic color variables
- Maintain consistent spacing units (4px, 8px, 16px, 24px, 32px)

### Code Quality

#### Linting and Formatting
```bash
npm run lint          # Check for issues
npm run lint --fix    # Auto-fix issues
npm run type-check    # TypeScript validation
```

#### Testing
- Write unit tests for utilities and hooks
- Test components with React Native Testing Library  
- Include integration tests for critical user flows
- Aim for >80% code coverage

#### Git Workflow
1. Create feature branch from `main`
2. Make atomic commits with clear messages
3. Run tests and linting before committing
4. Create pull request with description
5. Address review feedback
6. Squash merge when approved

### Pull Request Guidelines

#### Description Template
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added/updated unit tests
- [ ] Tested on iOS/Android/Web
- [ ] Verified accessibility

## Design Review
- [ ] Follows design system guidelines
- [ ] Maintains two-color palette
- [ ] No emojis introduced
- [ ] Proper spacing and typography
```

#### Review Checklist
- Code follows TypeScript best practices
- Design adheres to minimalist principles
- No security vulnerabilities introduced
- Performance impact considered
- Accessibility requirements met

## Feature Development

### New Screen Development
1. Start with functional implementation
2. Apply PixelPerfect design system
3. Add TypeScript interfaces
4. Include error handling
5. Write tests
6. Update documentation

### Component Development
1. Create reusable, composable components
2. Use proper prop interfaces
3. Handle edge cases gracefully
4. Follow accessibility guidelines
5. Include usage examples

## Bug Reports

### Template
```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**  
What actually happens

**Environment**
- OS: [iOS/Android/Web]
- Version: [App version]
- Device: [Device model]
```

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Follow OWASP security guidelines
- Report security issues privately

## Performance

- Optimize images and assets
- Use lazy loading for screens
- Minimize bundle size
- Profile memory usage
- Test on lower-end devices

## Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Support screen readers
- Maintain high contrast ratios
- Test with accessibility tools

## Questions?

- Check existing documentation
- Search closed issues
- Create new issue with question label
- Join our developer community

Thank you for contributing to Cupido!