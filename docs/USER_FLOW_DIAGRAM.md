# PromptShield User Flow Diagram

## Overview

This diagram shows the complete user journey through PromptShield, from initial setup to scanning and validation.

```mermaid
graph TD
    %% User Entry Points
    A[User Starts] --> B{What does user want to do?}

    %% Main User Paths
    B -->|Scan LLM Outputs| C[Scan Command]
    B -->|Validate Files| D[Validate Command]
    B -->|List Rules| E[List Command]
    B -->|Create RulePack| F[Init Command]

    %% Scan Command Flow
    C --> C1[User provides input file]
    C1 --> C2{Input Validation}
    C2 -->|Valid| C3[File Processing]
    C2 -->|Invalid| C2A[Show Error & Exit]

    C3 --> C4{File Type Detection}
    C4 -->|JSON| C5A[JSON Processor]
    C4 -->|NDJSON| C5B[NDJSON Processor]
    C4 -->|Text| C5C[Text Processor]

    C5A --> C6[Rule Engine]
    C5B --> C6
    C5C --> C6

    C6 --> C7[Apply RulePack Rules]
    C7 --> C8[Generate Violations]
    C8 --> C9[Filter Results]
    C9 --> C10[Format Output]
    C10 --> C11[Display/Write Report]

    %% Validate Command Flow
    D --> D1[User provides target]
    D1 --> D2{Target Type}
    D2 -->|RulePack YAML| D3A[RulePack Validator]
    D2 -->|Input File| D3B[Input File Validator]

    D3A --> D4A[Validate YAML Syntax]
    D4A --> D5A[Validate Rule Schema]
    D5A --> D6A[Validate Regex Patterns]

    D3B --> D4B[Validate File Exists]
    D4B --> D5B[Validate File Format]
    D5B --> D6B[Validate Content Structure]

    D6A --> D7[Generate Validation Report]
    D6B --> D7
    D7 --> D8[Display Results]

    %% List Command Flow
    E --> E1[Load Available RulePacks]
    E1 --> E2[Parse RulePacks]
    E2 --> E3[Apply Filters]
    E3 --> E4[Format Rule List]
    E4 --> E5[Display Rules]

    %% Init Command Flow
    F --> F1[User provides filename]
    F1 --> F2{Template Selection}
    F2 -->|Basic| F3A[Basic Template]
    F2 -->|PII| F3B[PII Template]
    F2 -->|Security| F3C[Security Template]
    F2 -->|Bias| F3D[Bias Template]
    F2 -->|Compliance| F3E[Compliance Template]

    F3A --> F4[Generate RulePack]
    F3B --> F4
    F3C --> F4
    F3D --> F4
    F3E --> F4

    F4 --> F5[Write to File]
    F5 --> F6[Confirm Creation]

    %% Error Handling
    C2A --> G[Error Handling]
    D8 --> G
    E5 --> G
    F6 --> G

    G --> H[Display Error Message]
    H --> I[Exit with Error Code]

    %% Success Paths
    C11 --> J[Success]
    D8 --> J
    E5 --> J
    F6 --> J

    J --> K[Exit Successfully]

    %% Styling
    classDef userAction fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef validation fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef processing fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class A,B,C,D,E,F userAction
    class C2,D2,D3A,D3B,D4A,D4B,D5A,D5B,D6A,D6B validation
    class C3,C4,C5A,C5B,C5C,C6,C7,C8,C9,C10,C11,E1,E2,E3,E4,F1,F2,F3A,F3B,F3C,F3D,F3E,F4,F5 processing
    class C2A,G,H,I error
    class J,K success
```

## Detailed User Journeys

### 1. **Scan Command Journey**

```
User Input → Validation → Processing → Rule Application → Output Generation
```

**Key Steps:**

1. **Input Validation** - Validates file exists and format
2. **File Processing** - Detects JSON/NDJSON/Text and processes accordingly
3. **Rule Application** - Applies RulePack rules to content
4. **Violation Generation** - Creates violation objects for matches
5. **Filtering** - Applies severity/category filters
6. **Output Formatting** - Generates report in requested format

### 2. **Validate Command Journey**

```
User Target → Type Detection → Specific Validation → Report Generation
```

**Key Steps:**

1. **Target Analysis** - Determines if RulePack or input file
2. **RulePack Validation** - YAML syntax, rule schema, regex patterns
3. **Input File Validation** - File existence, format, content structure
4. **Report Generation** - Detailed validation results

### 3. **List Command Journey**

```
RulePack Discovery → Parsing → Filtering → Display
```

**Key Steps:**

1. **Discovery** - Finds available RulePacks
2. **Parsing** - Reads and parses YAML files
3. **Filtering** - Applies category/severity filters
4. **Display** - Shows formatted rule list

### 4. **Init Command Journey**

```
Template Selection → Generation → File Creation → Confirmation
```

**Key Steps:**

1. **Template Selection** - User chooses template type
2. **Generation** - Creates RulePack with sample rules
3. **File Creation** - Writes YAML file to disk
4. **Confirmation** - Shows success message

## Validation Points (All Tested ✅)

### **Input File Validation**

- ✅ File existence check
- ✅ File format validation (JSON, NDJSON, Text)
- ✅ Content structure validation
- ✅ File readability check

### **RulePack Validation**

- ✅ YAML syntax validation
- ✅ Rule schema validation
- ✅ Regex pattern validation
- ✅ Required fields validation

### **Validation Engine**

- ✅ Type detection based on file extension
- ✅ Validator selection and routing
- ✅ Error propagation and handling
- ✅ Batch validation support

### **Violation Handling**

- ✅ Violation object creation
- ✅ Position and context tracking
- ✅ Metadata and confidence scoring
- ✅ Severity and category classification

## Error Handling

### **User-Friendly Errors**

- File not found → Clear error message with path
- Invalid format → Explanation of supported formats
- Validation failures → Detailed error report
- Processing errors → Graceful degradation

### **Exit Codes**

- `0` - Success
- `1` - Validation errors
- `2` - Processing errors
- `3` - Configuration errors

## Performance Considerations

### **Streaming Support**

- Large JSON arrays → Streaming processing
- NDJSON files → Line-by-line processing
- Memory management → Threshold warnings

### **Parallel Processing**

- Multi-core scanning → Parallel rule application
- Batch processing → Configurable batch sizes
- Timeout handling → Processing time limits

This flow diagram represents the complete user experience, with all the validation and processing steps that users will encounter when using PromptShield.
