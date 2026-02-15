# Duckyscript Implementation Guide

## Overview

This implementation adds full duckyscript support to the ToothPaste BulkSend component with the following features:

- **File Upload**: Import `.txt` duckyscript files
- **Script Editor**: Edit duckyscript with real-time parsing and validation
- **Encrypted Storage**: Scripts are saved to IndexedDB with AES-GCM encryption
- **Execution Time Estimation**: Visual feedback on expected execution duration
- **Syntax Validation**: Real-time error detection and reporting

## Architecture

### File Structure

```
src/
├── services/
│   └── duckyscript/
│       ├── DuckyscriptParser.js      # Lexer & parser for duckyscript syntax
│       └── DuckyscriptService.js     # Encrypted storage & file management
├── context/
│   └── DuckyscriptContext.jsx        # State management (similar to BLEContext)
├── components/
│   └── duckyscript/
│       └── DuckyscriptEditor.jsx     # UI component for script editing
└── views/
    └── BulkSend.jsx                  # Updated with Duckyscript tab
```

### Components Overview

#### DuckyscriptParser.js
Provides tokenization and parsing of duckyscript syntax:

```javascript
import { parseDuckyscript, estimateExecutionTime } from './services/duckyscript/DuckyscriptParser';

const result = parseDuckyscript('STRING "Hello"\nDELAY 1000');
// Returns: { tokens, ast, errors, isValid }
```

**Supported Commands:**
- `DELAY <ms>` - Pause execution
- `DEFAULT_DELAY <ms>` - Set default inter-keystroke delay
- `STRING "<text>"` - Type text
- `PRESS <key>` - Press a key
- `RELEASE <key>` - Release a key
- `TAP <key>` - Tap a key
- `REPEAT <count>` - Repeat following commands
- `REM <comment>` - Comment
- `// <comment>` - Comment (alternative syntax)

**Example Script:**
```duckyscript
// Configure delays
DEFAULT_DELAY 50

// Type a command
STRING "Hello World"
DELAY 500

// Press keys
PRESS ENTER
```

#### DuckyscriptService.js
Manages encrypted storage and file operations:

```javascript
import * as DuckyscriptService from './services/duckyscript/DuckyscriptService';

// List all saved scripts
const scripts = await DuckyscriptService.listScripts();

// Save a script
const script = await DuckyscriptService.saveScript(
    'My Script',
    'STRING "Hello"\nDELAY 1000',
    null  // scriptId (null for new)
);

// Load a script
const loaded = await DuckyscriptService.loadScript(scriptId);

// Import from file
const imported = await DuckyscriptService.importScriptFile(file);

// Export as file
await DuckyscriptService.exportScriptFile(scriptId);

// Delete a script
await DuckyscriptService.deleteScript(scriptId);
```

**Storage Details:**
- **Client ID**: `duckyscript-scripts`
- **Index Key**: `scripts-index`
- **Encryption**: AES-GCM with EncryptedStorage
- **Location**: IndexedDB (encrypted)
- **Requirements**: Must call `unlockWithPassword()` or `unlockPasswordless()` first

#### DuckyscriptContext.jsx
Provides state management and reactive updates:

```javascript
import { DuckyscriptContext } from '../context/DuckyscriptContext';
import { useContext } from 'react';

const {
    scripts,           // Array of script summaries
    currentScript,     // Currently open script
    editingContent,    // Current edit text
    parseResult,       // { tokens, ast, errors, isValid }
    isLoading,         // Loading state
    error,             // Error message
    
    // Methods
    loadScripts,       // Reload all scripts
    openScript,        // Open script by ID
    createNewScript,   // Start new blank script
    updateContent,     // Update editing content & parse
    saveCurrentScript, // Save current script
    deleteCurrentScript, // Delete current script
    importScript,      // Import from file
    exportScript,      // Export to file
    closeScript,       // Close editor
    getEstimatedTime,  // Get execution time in ms
} = useContext(DuckyscriptContext);
```

#### DuckyscriptEditor.jsx
React component for the script editor UI:

```jsx
import DuckyscriptEditor from '../components/duckyscript/DuckyscriptEditor';

<DuckyscriptEditor onScriptSelected={(script) => {
    console.log('User selected:', script);
}} />
```

**Features:**
- Create new scripts
- Import `.txt` files
- Edit with syntax highlighting info
- Save with validation
- Delete with confirmation
- Export as `.txt` file
- Real-time error display

### Integration in BulkSend.jsx

The BulkSend component now has two tabs:

1. **Text Tab** - Original functionality
2. **Duckyscript Tab** - Script management and execution

```jsx
<Tabs value={activeTab}>
    <TabsHeader>
        <Tab value="text">Text</Tab>
        <Tab value="duckyscript">Duckyscript</Tab>
    </TabsHeader>
    
    <TabsBody>
        {/* Text tab content */}
        {/* Duckyscript tab with DuckyscriptEditor */}
    </TabsBody>
</Tabs>
```

## Usage Workflow

### 1. First Time Setup
- User navigates to BulkSend → Duckyscript tab
- If storage is not unlocked, AuthenticationOverlay prompts for setup
- Scripts are encrypted and stored in IndexedDB

### 2. Creating a Script
```
1. Click "New Script"
2. Enter script name and code
3. Real-time validation shows errors
4. Click "Save Script"
```

### 3. Using Existing Scripts
```
1. Scripts list shows all saved scripts
2. Click to open/edit
3. Click "Execute Script" to send to device
```

### 4. Importing Scripts
```
1. Click "Import"
2. Select .txt file
3. Script automatically saved and appears in list
```

## Security Considerations

- **Encryption**: All scripts stored with AES-GCM encryption using the session key
- **Storage**: IndexedDB + localStorage (salts/metadata)
- **Keys**: Derived from user password using Argon2id
- **Unlock Required**: Storage must be unlocked before scripts can be accessed
- **Validation**: Validation tokens prevent password tampering

## Extending with More Commands

To add new duckyscript commands:

1. **Add to ValidCommands** in `DuckyscriptParser.js`:
```javascript
export const ValidCommands = {
    // ... existing commands
    MY_COMMAND: 'MY_COMMAND',
};
```

2. **Add validation** in `validateCommand()`:
```javascript
case ValidCommands.MY_COMMAND:
    if (args.length === 0) {
        return { error: 'MY_COMMAND requires arguments' };
    }
    break;
```

3. **Add to tokenizer** (if custom syntax needed)

4. **Add execution logic** to implement actual behavior

## Execution Flow

Currently, the `sendDuckyscript()` function in BulkSend sends the raw script content. For full implementation with proper command execution:

1. Parse script to AST
2. For each command in AST:
   - DELAY: Wait
   - STRING: Send characters via keyboardHandler
   - PRESS/TAP: Send key events
   - etc.

```javascript
const { ast } = parseResult;
for (const node of ast) {
    switch (node.command) {
        case 'DELAY':
            await sleep(node.args[0].value);
            break;
        case 'STRING':
            await keyboardHandler.sendKeyboardString(node.args[0].value);
            break;
        // ... etc
    }
}
```

## Error Handling

The system provides:
- **Parse Errors**: Syntax/validation errors with line numbers
- **Storage Errors**: Encrypted storage access failures
- **File Errors**: Import/export failures
- **User Feedback**: All errors displayed in UI

## Testing

Example duckyscript for testing:

```duckyscript
// Test basic functionality
DEFAULT_DELAY 100

// Type
STRING "Hello "

// Delay
DELAY 500

// Type more
STRING "World"

// Finish
PRESS ENTER
```

## Browser Compatibility

- Requires WebCrypto API (AES-GCM)
- Requires IndexedDB
- Tested on Chrome, Firefox, Safari, Edge
- Local file read via FileReader API

## Future Enhancements

- [ ] Advanced command support (HOLD, loops, conditionals)
- [ ] Macro recording UI
- [ ] Syntax highlighting in editor
- [ ] Script validation UI improvements
- [ ] Multiple script execution (sequences)
- [ ] Variables and expressions
- [ ] Device-side macro compilation
- [ ] Performance metrics on execution
