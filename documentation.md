# Documentation

## How to use the website
As of last update, you are able to filter based on fruits and vegetables, filter based on store name, and filter based on price.
- Use the dropdown to filter for produce type
- Search by store name using the labeled text box
- Filter by maximum price for each produce using its respective text box

## How the website works
### Dropdown
When clicked, add the "show" class to the dropdown element. This shows it to the user. When the user selects one of the options, it will update the value in the code as well as change the button text

### Autocomplete
When the user types in the textbox, the program loops over every store name. If the store name starts with what the user inputed (e.g. target would match if the user typed in "tar"), then add it to a div.

### Filtering
First, loop over each textbox for price. If the value entered is valid, add it to a list. If it is invalid or empty, add an arbitrary high number. Any high number ensures that every price will be below it, making that specific filter do nothing. Then, loop over every row. Check the prices stored in the row (stored in the data-full tag), and make any row that has a price higher then what the user entered invisible. Also check if the store name contains what the user inputted for store name.

Then, loop over every cell in the row. If the user selected either fruits or vegetables only, then make any cell that isn't what the user selected invisible.

### Loading the table
First, the csv is downloaded with a custom python script, that saves it from google sheets and crops out unneccecary data.

When the user loads the page, the javascript gets the csv, and uses the papaparse library to decode it into JSON. It then loops over every row in this JSON and appends it to the table, following a template.

Then, it synchronizes the horizontal scrolling for each row. It does this by applying an event listener, that listens for the scroll event. Whenever one of the rows is scrolled, it updates every other row to match its scroll position.

Finally it initializes the autocomplete function mentioned previously.