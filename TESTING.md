# Flipset Testing Checklist

Manual testing checklist for the Flipset flashcard app. Update this file as new features are added.

## Cards

### Creating Cards
- [ ] Tap "+" to create a new card
- [ ] Add content to front (term) field using rich text editor
- [ ] Add content to back (definition) field using rich text editor
- [ ] Select one or more categories
- [ ] Create a new category inline via "Add" button
- [ ] Verify newly created category is auto-selected
- [ ] Save card and verify it appears in the cards list
- [ ] Cancel creating a card and verify no card is created

### Rich Text Editor
- [ ] Bold text (B button)
- [ ] Italic text (I button)
- [ ] Underline text (U button)
- [ ] Bullet list (• button)
- [ ] Numbered list (1. button)
- [ ] Voice input via microphone button
- [ ] OCR text extraction via camera button (take photo)
- [ ] OCR text extraction via camera button (choose from library)
- [ ] Image cropping works before OCR processing
- [ ] Cancel/Save buttons work correctly

### Editing Cards
- [ ] Tap on a card to edit it
- [ ] Modify front content
- [ ] Modify back content
- [ ] Change category selection
- [ ] Save changes and verify they persist
- [ ] Cancel editing and verify original content remains

### Deleting Cards
- [ ] Delete card from edit screen
- [ ] Delete card during review session
- [ ] Confirm deletion dialog appears
- [ ] Card is removed from all views after deletion

## Categories

### Creating Categories
- [ ] Create category from Categories tab
- [ ] Create category inline while adding/editing a card
- [ ] Category name is required (validation)
- [ ] New category appears in categories list

### Editing Categories
- [ ] Tap on category to edit
- [ ] Change category name
- [ ] Save changes

### Deleting Categories
- [ ] Delete empty category (shows confirmation)
- [ ] Delete category with cards - move to Uncategorized
- [ ] Delete category with cards - move to another category
- [ ] Delete category with cards - delete all cards
- [ ] Uncategorized category cannot be deleted

## Review Sessions

### Starting a Session
- [ ] Select one or more categories
- [ ] "Select All" selects all categories
- [ ] Categories with 0 cards are disabled
- [ ] Card count updates as categories are selected
- [ ] Choose "Randomized" order
- [ ] Choose "Ordered" order
- [ ] Start session button works

### During a Session
- [ ] Card front is displayed initially
- [ ] "Show Back" reveals the answer
- [ ] "Show Front" returns to the question
- [ ] Swipe right marks card as correct (green overlay)
- [ ] Swipe left marks card as wrong (red overlay)
- [ ] "Correct" button works
- [ ] "Wrong" button works
- [ ] "Skip" button moves to next card
- [ ] Progress bar updates correctly
- [ ] Round counter increments when all cards reviewed
- [ ] Wrong cards return in subsequent rounds
- [ ] Edit button opens card editor
- [ ] Card updates after editing and returning
- [ ] Delete button removes card from session

### Session Persistence
- [ ] Exit mid-session and return to Review tab
- [ ] "Session in Progress" card appears
- [ ] Resume button continues session
- [ ] End Session button clears session (with confirmation)

### Session Complete
- [ ] Session complete screen shows when all cards correct
- [ ] Total cards and rounds displayed
- [ ] "Start Over" restarts the session
- [ ] "Finish" returns to Review tab

## Settings

### Export
- [ ] "Share File" exports JSON and opens share sheet
- [ ] "Copy JSON" copies export data to clipboard
- [ ] Exported JSON contains all cards and categories

### Import
- [ ] "Choose File" opens document picker
- [ ] "Paste JSON" opens paste modal
- [ ] Invalid JSON shows error
- [ ] Valid JSON imports successfully
- [ ] Duplicate categories prompt for merge/overwrite
- [ ] Import count shown after completion

## Navigation

- [ ] Tab bar shows Review, Cards, Categories, Settings
- [ ] Back button shows "Back" text (not "(tabs)")
- [ ] All modals can be dismissed
- [ ] Deep navigation works (e.g., edit card from review session)

## Visual/UI

- [ ] Dark theme displays correctly
- [ ] All text is readable
- [ ] Touch targets are appropriately sized
- [ ] Loading indicators appear during async operations
- [ ] Empty states show helpful messages and actions

## Platform-Specific

### iOS
- [ ] Safe area insets respected
- [ ] Status bar style matches theme
- [ ] Page sheet modals work correctly
- [ ] Action sheets for image picker

### Android
- [ ] Status bar color matches theme
- [ ] Alert dialogs for image picker
- [ ] Back button behavior correct

## Edge Cases

- [ ] App works with no cards
- [ ] App works with no categories (only Uncategorized)
- [ ] Very long card content scrolls
- [ ] Many categories scroll horizontally in picker
- [ ] Session with single card works
- [ ] Session with all cards marked correct on first try
