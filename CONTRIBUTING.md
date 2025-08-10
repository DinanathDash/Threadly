# Contributing to Threadly

Thank you for considering contributing to Threadly! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by its Code of Conduct. Please report unacceptable behavior to [project email].

## How Can I Contribute?

### Reporting Bugs

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/DinanathDash/Threadly/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/DinanathDash/Threadly/issues/new). Include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Features

- Open a new issue with a clear title and detailed description of the feature you'd like to see implemented.
- Explain why this feature would be useful to most Threadly users.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Install development dependencies** with `npm install`.
3. If you've added code that should be tested, **add tests**.
4. If you've changed APIs, **update the documentation**.
5. **Ensure the test suite passes** with `npm test`.
6. **Make sure your code lints** with `npm run lint`.
7. **Submit your pull request** with a clear description of the changes.

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/DinanathDash/Threadly.git
cd Threadly
```

2. Install dependencies
```bash
npm install
```

3. Follow the setup instructions in the README.md to configure Firebase and Slack integration.

4. Start the development servers
```bash
npm run dev          # Frontend
npm run dev:server   # Backend
```

## Styleguides

### JavaScript/TypeScript Styleguide

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Prefer arrow functions
- Follow ESLint configuration

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Additional Notes

### Issue and Pull Request Labels

- `bug`: Indicates an unexpected problem or unintended behavior
- `documentation`: Improvements or additions to documentation
- `enhancement`: New feature or request
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

Thank you for contributing to Threadly!
