# Scripts Directory

Organized collection of utility scripts for data research, analysis, and operations.

## Structure

```
scripts/
├── bash/              # Shell scripts for automation
├── sql/               # Database queries and analysis
├── python/            # Data analysis and processing
├── javascript/        # Data manipulation and API testing
└── data-analysis/     # Research scripts and notebooks
```

## Usage Guidelines

### Naming Conventions
- Use descriptive names: `analyze_brewery_production.sql`
- Include date for one-off analysis: `brewery_export_2024-09-18.py`
- Use prefixes for categories: `etl_import_recipes.js`

### Documentation
- Include header comments explaining purpose
- Document required parameters/environment variables
- Add usage examples

### Examples

**SQL Analysis:**
```sql
-- scripts/sql/tenant_usage_analysis.sql
-- Purpose: Analyze tenant activity patterns
-- Usage: psql -d fermentum -f scripts/sql/tenant_usage_analysis.sql
```

**Python Data Processing:**
```python
# scripts/python/export_brewery_data.py
# Purpose: Export tenant data for migration
# Usage: python scripts/python/export_brewery_data.py --tenant-id 123
```

**Bash Automation:**
```bash
#!/bin/bash
# scripts/bash/backup_tenant_schemas.sh
# Purpose: Backup individual tenant schemas
# Usage: ./scripts/bash/backup_tenant_schemas.sh tenant_123
```