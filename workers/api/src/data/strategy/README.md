# Curated Strategy Data

This folder contains curated achievement strategies contributed by the community.

## File Format

Each file is named `{achievementId}.json` and contains:

```json
{
  "id": 12345,
  "name": "Achievement Name",
  "strategy": [
    {
      "title": "Strategy Title",
      "steps": [
        "Step 1 description",
        "Step 2 description"
      ]
    }
  ]
}
```

## Contributing

1. Create a new file named `{achievementId}.json`
2. Follow the format above
3. Submit a PR

## Guidelines

- Keep steps concise and actionable
- Include coordinates where relevant (e.g., "Go to 45.2, 67.8 in Valdrakken")
- Mention required items, group size, or prerequisites
- Multiple strategies can be included for different approaches
