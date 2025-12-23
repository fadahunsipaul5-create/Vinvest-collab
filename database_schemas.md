# Database Schemas

## Production Database: PostgreSQL

### Account App Tables

#### account_user
```sql
CREATE TABLE account_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    subscription_status VARCHAR(50),
    questions_remaining INTEGER NOT NULL DEFAULT 10,
    subscription_period_end TIMESTAMP WITH TIME ZONE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_account_user_email ON account_user(email);
```

#### account_resetpassword
```sql
CREATE TABLE account_resetpassword (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_resetpassword_user ON account_resetpassword(user_id);
```

### SEC App Tables

#### sec_app_company
```sql
CREATE TABLE sec_app_company (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    cik VARCHAR(10) UNIQUE,
    sector VARCHAR(100),
    industry VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_company_ticker ON sec_app_company(ticker);
```

#### sec_app_financialperiod
```sql
CREATE TABLE sec_app_financialperiod (
    id BIGSERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL,
    period_type VARCHAR(10) NOT NULL DEFAULT 'annual',
    start_date DATE,
    end_date DATE,
    filing_date DATE,
    company_id BIGINT NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(company_id, period)
);

CREATE INDEX idx_financialperiod_company ON sec_app_financialperiod(company_id);
CREATE INDEX idx_financialperiod_period ON sec_app_financialperiod(period);
```

#### sec_app_financialmetric
```sql
CREATE TABLE sec_app_financialmetric (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    xbrl_tag VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'USD',
    company_id BIGINT REFERENCES sec_app_company(id) ON DELETE CASCADE,
    period_id BIGINT NOT NULL REFERENCES sec_app_financialperiod(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(metric_name, period_id, company_id)
);

CREATE INDEX idx_financialmetric_company_metric_period ON sec_app_financialmetric(company_id, metric_name, period_id);
CREATE INDEX idx_financialmetric_metric_name ON sec_app_financialmetric(metric_name);
CREATE INDEX idx_financialmetric_period ON sec_app_financialmetric(period_id);
```

#### sec_app_filing
```sql
CREATE TABLE sec_app_filing (
    id BIGSERIAL PRIMARY KEY,
    form VARCHAR(10) NOT NULL,
    filing_date DATE NOT NULL,
    accession_number VARCHAR(20),
    fiscal_year_end DATE,
    company_id BIGINT NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    UNIQUE(company_id, filing_date, form)
);

CREATE INDEX idx_filing_company ON sec_app_filing(company_id);
CREATE INDEX idx_filing_date ON sec_app_filing(filing_date DESC);
```

#### sec_app_filingdocument
```sql
CREATE TABLE sec_app_filingdocument (
    id BIGSERIAL PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    filing_id BIGINT NOT NULL REFERENCES sec_app_filing(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    period_id BIGINT NOT NULL REFERENCES sec_app_financialperiod(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_filingdocument_filing ON sec_app_filingdocument(filing_id);
CREATE INDEX idx_filingdocument_company ON sec_app_filingdocument(company_id);
CREATE INDEX idx_filingdocument_period ON sec_app_filingdocument(period_id);
```

#### sec_app_sentimentanalysis
```sql
CREATE TABLE sec_app_sentimentanalysis (
    id BIGSERIAL PRIMARY KEY,
    sentiment_score DOUBLE PRECISION NOT NULL,
    sentiment_label VARCHAR(10) NOT NULL,
    keywords JSONB,
    document_id BIGINT NOT NULL REFERENCES sec_app_filingdocument(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sentimentanalysis_document ON sec_app_sentimentanalysis(document_id);
```

#### sec_app_chatlog
```sql
CREATE TABLE sec_app_chatlog (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### sec_app_query
```sql
CREATE TABLE sec_app_query (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### sec_app_contact
```sql
CREATE TABLE sec_app_contact (
    id BIGSERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    message TEXT NOT NULL
);
```

#### sec_app_metricmapping
```sql
CREATE TABLE sec_app_metricmapping (
    id BIGSERIAL PRIMARY KEY,
    xbrl_tag VARCHAR(100) UNIQUE NOT NULL,
    standard_name VARCHAR(100) NOT NULL,
    priority BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### company_multiples
```sql
CREATE TABLE company_multiples (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    numerators JSONB NOT NULL DEFAULT '{}',
    denominators JSONB NOT NULL DEFAULT '{}',
    roic_metrics JSONB NOT NULL DEFAULT '{}',
    revenue_growth JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_company_multiples_ticker ON company_multiples(ticker);
```

#### sec_app_chatsession
```sql
CREATE TABLE sec_app_chatsession (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatsession_user ON sec_app_chatsession(user_id);
CREATE INDEX idx_chatsession_updated ON sec_app_chatsession(updated_at DESC);
```

#### sec_app_chathistory
```sql
CREATE TABLE sec_app_chathistory (
    id BIGSERIAL PRIMARY KEY,
    question TEXT,
    answer TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    session_id BIGINT NOT NULL REFERENCES sec_app_chatsession(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chathistory_session ON sec_app_chathistory(session_id);
CREATE INDEX idx_chathistory_user ON sec_app_chathistory(user_id);
CREATE INDEX idx_chathistory_timestamp ON sec_app_chathistory(timestamp);
```

#### sec_app_chatbatch
```sql
CREATE TABLE sec_app_chatbatch (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatbatch_user ON sec_app_chatbatch(user_id);
CREATE INDEX idx_chatbatch_updated ON sec_app_chatbatch(updated_at DESC);
```

#### sec_app_stripeevent
```sql
CREATE TABLE sec_app_stripeevent (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payload JSONB NOT NULL
);

CREATE INDEX idx_stripeevent_event_id ON sec_app_stripeevent(event_id);
CREATE INDEX idx_stripeevent_type ON sec_app_stripeevent(type);
```

### Django Built-in Tables

#### django_migrations
```sql
CREATE TABLE django_migrations (
    id BIGSERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMP WITH TIME ZONE NOT NULL
);
```

#### django_content_type
```sql
CREATE TABLE django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE(app_label, model)
);
```

#### django_session
```sql
CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_session_expire_date ON django_session(expire_date);
```

#### auth_group, auth_permission, auth_group_permissions
```sql
CREATE TABLE auth_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE auth_permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type(id),
    codename VARCHAR(100) NOT NULL,
    UNIQUE(content_type_id, codename)
);

CREATE TABLE auth_group_permissions (
    id BIGSERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES auth_group(id),
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id),
    UNIQUE(group_id, permission_id)
);
```

#### account_user_groups, account_user_permissions
```sql
CREATE TABLE account_user_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

CREATE TABLE account_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES account_user(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
);
```

---

## Local Database: SQLite3

### Account App Tables

#### account_user
```sql
CREATE TABLE account_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME,
    is_superuser BOOLEAN NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT 0,
    date_joined DATETIME NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    subscription_status VARCHAR(50),
    questions_remaining INTEGER NOT NULL DEFAULT 10,
    subscription_period_end DATETIME,
    is_staff BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1
);

CREATE INDEX idx_account_user_email ON account_user(email);
```

#### account_resetpassword
```sql
CREATE TABLE account_resetpassword (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(6) NOT NULL,
    created_at DATETIME NOT NULL,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_resetpassword_user ON account_resetpassword(user_id);
```

### SEC App Tables

#### sec_app_company
```sql
CREATE TABLE sec_app_company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    cik VARCHAR(10) UNIQUE,
    sector VARCHAR(100),
    industry VARCHAR(100),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_company_ticker ON sec_app_company(ticker);
```

#### sec_app_financialperiod
```sql
CREATE TABLE sec_app_financialperiod (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period VARCHAR(20) NOT NULL,
    period_type VARCHAR(10) NOT NULL DEFAULT 'annual',
    start_date DATE,
    end_date DATE,
    filing_date DATE,
    company_id INTEGER NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE(company_id, period)
);

CREATE INDEX idx_financialperiod_company ON sec_app_financialperiod(company_id);
CREATE INDEX idx_financialperiod_period ON sec_app_financialperiod(period);
```

#### sec_app_financialmetric
```sql
CREATE TABLE sec_app_financialmetric (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    value REAL NOT NULL DEFAULT 0.0,
    xbrl_tag VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'USD',
    company_id INTEGER REFERENCES sec_app_company(id) ON DELETE CASCADE,
    period_id INTEGER NOT NULL REFERENCES sec_app_financialperiod(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE(metric_name, period_id, company_id)
);

CREATE INDEX idx_financialmetric_company_metric_period ON sec_app_financialmetric(company_id, metric_name, period_id);
CREATE INDEX idx_financialmetric_metric_name ON sec_app_financialmetric(metric_name);
CREATE INDEX idx_financialmetric_period ON sec_app_financialmetric(period_id);
```

#### sec_app_filing
```sql
CREATE TABLE sec_app_filing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form VARCHAR(10) NOT NULL,
    filing_date DATE NOT NULL,
    accession_number VARCHAR(20),
    fiscal_year_end DATE,
    company_id INTEGER NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    UNIQUE(company_id, filing_date, form)
);

CREATE INDEX idx_filing_company ON sec_app_filing(company_id);
CREATE INDEX idx_filing_date ON sec_app_filing(filing_date DESC);
```

#### sec_app_filingdocument
```sql
CREATE TABLE sec_app_filingdocument (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    filing_id INTEGER NOT NULL REFERENCES sec_app_filing(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES sec_app_company(id) ON DELETE CASCADE,
    period_id INTEGER NOT NULL REFERENCES sec_app_financialperiod(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_filingdocument_filing ON sec_app_filingdocument(filing_id);
CREATE INDEX idx_filingdocument_company ON sec_app_filingdocument(company_id);
CREATE INDEX idx_filingdocument_period ON sec_app_filingdocument(period_id);
```

#### sec_app_sentimentanalysis
```sql
CREATE TABLE sec_app_sentimentanalysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sentiment_score REAL NOT NULL,
    sentiment_label VARCHAR(10) NOT NULL,
    keywords TEXT,  -- JSON stored as TEXT in SQLite
    document_id INTEGER NOT NULL REFERENCES sec_app_filingdocument(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_sentimentanalysis_document ON sec_app_sentimentanalysis(document_id);
```

#### sec_app_chatlog
```sql
CREATE TABLE sec_app_chatlog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context TEXT,  -- JSON stored as TEXT in SQLite
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### sec_app_query
```sql
CREATE TABLE sec_app_query (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### sec_app_contact
```sql
CREATE TABLE sec_app_contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    message TEXT NOT NULL
);
```

#### sec_app_metricmapping
```sql
CREATE TABLE sec_app_metricmapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    xbrl_tag VARCHAR(100) UNIQUE NOT NULL,
    standard_name VARCHAR(100) NOT NULL,
    priority BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### company_multiples
```sql
CREATE TABLE company_multiples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    numerators TEXT NOT NULL DEFAULT '{}',  -- JSON stored as TEXT in SQLite
    denominators TEXT NOT NULL DEFAULT '{}',
    roic_metrics TEXT NOT NULL DEFAULT '{}',
    revenue_growth TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX idx_company_multiples_ticker ON company_multiples(ticker);
```

#### sec_app_chatsession
```sql
CREATE TABLE sec_app_chatsession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatsession_user ON sec_app_chatsession(user_id);
CREATE INDEX idx_chatsession_updated ON sec_app_chatsession(updated_at DESC);
```

#### sec_app_chathistory
```sql
CREATE TABLE sec_app_chathistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    session_id INTEGER NOT NULL REFERENCES sec_app_chatsession(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chathistory_session ON sec_app_chathistory(session_id);
CREATE INDEX idx_chathistory_user ON sec_app_chathistory(user_id);
CREATE INDEX idx_chathistory_timestamp ON sec_app_chathistory(timestamp);
```

#### sec_app_chatbatch
```sql
CREATE TABLE sec_app_chatbatch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    messages TEXT NOT NULL DEFAULT '[]',  -- JSON stored as TEXT in SQLite
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatbatch_user ON sec_app_chatbatch(user_id);
CREATE INDEX idx_chatbatch_updated ON sec_app_chatbatch(updated_at DESC);
```

#### sec_app_stripeevent
```sql
CREATE TABLE sec_app_stripeevent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    received_at DATETIME NOT NULL,
    payload TEXT NOT NULL  -- JSON stored as TEXT in SQLite
);

CREATE INDEX idx_stripeevent_event_id ON sec_app_stripeevent(event_id);
CREATE INDEX idx_stripeevent_type ON sec_app_stripeevent(type);
```

### Django Built-in Tables

#### django_migrations
```sql
CREATE TABLE django_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied DATETIME NOT NULL
);
```

#### django_content_type
```sql
CREATE TABLE django_content_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE(app_label, model)
);
```

#### django_session
```sql
CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date DATETIME NOT NULL
);

CREATE INDEX idx_session_expire_date ON django_session(expire_date);
```

#### auth_group, auth_permission, auth_group_permissions
```sql
CREATE TABLE auth_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE auth_permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type(id),
    codename VARCHAR(100) NOT NULL,
    UNIQUE(content_type_id, codename)
);

CREATE TABLE auth_group_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES auth_group(id),
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id),
    UNIQUE(group_id, permission_id)
);
```

#### account_user_groups, account_user_permissions
```sql
CREATE TABLE account_user_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

CREATE TABLE account_user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES account_user(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
);
```

---

## Key Differences Between PostgreSQL and SQLite3

1. **Primary Keys**: 
   - PostgreSQL: `BIGSERIAL` or `SERIAL`
   - SQLite3: `INTEGER PRIMARY KEY AUTOINCREMENT`

2. **Timestamps**:
   - PostgreSQL: `TIMESTAMP WITH TIME ZONE`
   - SQLite3: `DATETIME`

3. **Floating Point**:
   - PostgreSQL: `DOUBLE PRECISION`
   - SQLite3: `REAL`

4. **JSON Fields**:
   - PostgreSQL: `JSONB` (native JSON type with indexing)
   - SQLite3: `TEXT` (JSON stored as text, parsed at application level)

5. **Boolean**:
   - PostgreSQL: `BOOLEAN` (true/false)
   - SQLite3: `BOOLEAN` (stored as INTEGER: 0/1)

6. **Indexes**:
   - Both support similar index syntax, but PostgreSQL has more advanced indexing options (GIN, GiST, etc.)

## Important Notes

- **EquityValue** is stored in `sec_app_financialmetric` table with:
  - `metric_name = 'EquityValue'`
  - `period.period = 'valuation'` (special period type)
  - `period.period_type = 'valuation'`

- **Financial Data** is stored in `sec_app_financialmetric` with:
  - Various `metric_name` values (Revenue, CostOfRevenue, etc.)
  - Linked to `sec_app_financialperiod` with actual year periods (e.g., "2005", "2006")

- **Company Multiples** data is stored in `company_multiples` table with JSON fields containing period-based metrics

