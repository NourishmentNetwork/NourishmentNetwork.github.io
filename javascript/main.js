// get data from url
async function getData(url){
    // creates a fetch request and then returns just the response
    const curRequest = new Request(url);
    return fetch(curRequest)
        .then((response)=>response.text()) // get only the text
        .then((text) => {
            return text // return it
        });
}

// load the table into a variable
const tableElement = document.getElementById("table");

// load and return the csv as a json object
async function get_csv(){
    // first use the get data function to open the csv file and get it as a string
    return await getData("/prices.csv")
        .then((csv) => { // then use papaparse to change it to a json object
            return Papa.parse(csv,{"header":true})["data"] 
            // also only return the data, and not the other things papaparse returns
            // e.g. errors
        });
}

// create empty global variable
var store_names = [];

async function render_rows(json_obj) {
    console.log(json_obj);
    // loop over json then add each row
    store_names=[];
    json_obj.forEach(row => {
        // use an html template, and fill in the costs and other data
        let item = document.createElement("div");
        item.classList.add("row"); // add proper classes
        item.dataset.full=btoa(JSON.stringify(row));
        item.innerHTML = `
<table>
    <tr>
        <th colspan="6"><h3>${row["Store Name"]}</h3></th>
    </tr>
    <tr>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="banana">
                Bananas: $ per pound
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="strawberry">
                Strawberries: $ per ounce
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="apple">
                Apples: $ per ounce
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="potato">
                Potatoes: $ per pound
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="onion">
                Onions: $ per pound
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="tomato">
                Tomatoes: $ per pound
            </div>
        </td>
    </tr>
    <tr>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="banana">
                $${row["Banana Price (lb)"]}
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="strawberry">
                $${row["Strawberry Price (oz)"]}
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="fruit" data-produce="apple">
                $${row["Apple Price (oz)"]}
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="potato">
                $${row["Potato Price (lb)"]}
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="onion">
                $${row["Onion Price (lb)"]}
            </div>
        </td>
        <td>
            <div class="priceelement" data-producetype="vegetable" data-produce="tomato">
                $${row["Tomato Price (lb)"]}
            </div>
        </td>
    </tr>
</table>
<hr>`;
 // each row contains data for produce type (vegetable or fruit, and actual produce type)
        tableElement.appendChild(item); // append the element to the table
        store_names.push(row["Store Name"]);
    });
    let tableend = document.createElement("div");
    tableend.innerHTML="<p>You've reached the end of the table. If results are too limited, try broadening your search.</p>";
    if (onmobile) {
        tableend.innerHTML+="<p>It is detected that you are on mobile. Although it should work, this site has not been designed for mobile devices yet.</p>"
    }
    tableElement.appendChild(tableend);
}

var prices_json; // create global variable

// this function also contains loading for everything
async function load_table(){
    // load the json into the global variable
    prices_json = await get_csv();

    // await render_rows(prices_json); unnececary, as sort_rows renders the rows already
    // sort_rows(); // render and sort the rows
    // sort rows already has the render rows and filter rows functions

    // // synchronize scrolling for each div
    // const divs = document.querySelectorAll('.rowdata');
    // const scroll_switch = document.getElementById("slide-sync");
    // divs.forEach(div => div.addEventListener( 'scroll', e => {
    //     if (scroll_switch.checked) {
    //         divs.forEach(d => { // when a div is scrolled update the rest to match
    //             d.scrollLeft = div.scrollLeft;
    //         });
    //     }
    // }) );

    start_autocomplete();

    // make it so checking any of the checkboxes sorts the rows

    const sort_boxes = document.querySelectorAll("#sort-row input");

    sort_boxes.forEach(checkbox => {
        checkbox.addEventListener("change",e=>{
            sort_boxes.forEach(box => {box.checked=false;});
            e.target.checked=true;
            sort_rows();
        })
    });
}

load_table(); // run the function

// tracks if the user has already sorted and filtered before or not
var first_time = true;

// function to both sort and filter the rows
function sort_and_filter(){
    if (first_time){document.getElementById("sort-row").classList.remove("hidden");}
    first_time=false; // update variable
    sort_rows();
    filter_rows();
}


// 1 is all
// 2 is fruits only
// 3 is vegetables only
var producetype=1;

// function that hides and shows rows based on what the user inputs
function filter_rows(){

    // load in the text box objects
    const price_text_boxes = document.querySelectorAll(".pricetextbox");

    // get the store name the user inputted 
    let store_name = document.getElementById("storenamesearch").value.toLowerCase();
    // changed to lowercase so it can match better

    // take every text box and load it into a list
    let prices = [];
    price_text_boxes.forEach(text_box =>{
        if (text_box.value != ""){ // skip over empty boxes
            let result = parseFloat(text_box.value); // attempt to convert into a float
            if (isNaN(result) || text_box.offsetParent === null){ 
                // if the box has invalid inputs
                // or if it is hidden (from the dropdown menu)
                console.log("invalid input");
                text_box.value = ""; // clear it
                prices.push(1000.0); // use placeholder for invalid input
                // no price should ever be over 1000, so it is used as a placeholder
            } else {prices.push(result);}
        } else {prices.push(1000.0)} // use placeholder for empty input
    })

    console.log("prices:");
    console.log(prices); // log the prices for debug
    
    // get all rows except the searchbar row
    const divs = document.querySelectorAll('.row:not(.search)');
    divs.forEach(row => {
        // get the data of the current row
        let row_data = JSON.parse(atob(row.dataset.full));
        
        // filter out based on inputs
        let invalid = (parseFloat(row_data["Banana Price (lb)"]) > prices[0]) ||  // check each price against what the user entered
                        (parseFloat(row_data["Strawberry Price (oz)"]) > prices[1]) ||
                        (parseFloat(row_data["Apple Price (oz)"]) > prices[2]) ||
                        (parseFloat(row_data["Potato Price (lb)"]) > prices[3]) ||
                        (parseFloat(row_data["Onion Price (lb)"]) > prices[4]) ||
                        (parseFloat(row_data["Tomato Price (lb)"]) > prices[5]) ||
                        !(row_data["Store Name"].toLowerCase().includes(store_name)); // if the store's name contains what the user entered

        // hide any rows that don't match the search
        if (invalid){
            row.classList.add("hidden");
        } else {
            // unhide rows that do match
            row.classList.remove("hidden");
        }
    });

    // create variables for easy filtering
    const produce_selections = Array.from(document.querySelectorAll(".produce_selector input")).map(a=>a.checked); // get all inputs of checkboxes
    const produce_types = ["banana","strawberry","apple","potato","onion","tomato"];
    console.log("selected produce:");
    console.log(produce_selections); // log for debug
    console.log(produce_types);

    // loop over every data item
    document.querySelectorAll(".priceelement").forEach((element) => {
        let current_producetype = element.dataset.producetype;
        
        // hide any ones that don't match the producetype
        element.classList.remove("hidden");
        element.parentElement.classList.remove("hidden");
        // if fruits only is selected and the produce type is vegetable
        // or if vegetables only and the produce type is fruit
        // or if it is not selected by the user
        if ((producetype === 2 && current_producetype === "vegetable") || (producetype === 3 && current_producetype === "fruit") || !produce_selections[produce_types.indexOf(element.dataset.produce)]){
            element.classList.add("hidden");
            element.parentElement.classList.add("hidden");
        }
    })
}

// function to sort a json object
function sortJson(jsonObj, paramName) {
    const val = document.getElementById("storenamesearch").value;
    return jsonObj.sort((a, b) => {
        const valueA = a[paramName];
        const valueB = b[paramName];

        // Check if the values are numerical
        const isNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);

        if (isNumeric(valueA) && isNumeric(valueB)) {
            // If both values are numerical, sort numerically
            return valueA - valueB;
        } else {
            // Otherwise, sort based on distance
            let a_dist = levDist(valueA, val, true);
            let b_dist = levDist(valueB, val, true);
            if (a_dist > b_dist){
                return 1;
            } else if (a_dist === b_dist) {
                return 0;
            } else {
                return -1;
            }
        }
    });
}

function unhide_table(){
    filter_rows();
    tableElement.classList.remove("hidden");
    document.getElementById("continue-button").remove();
}

async function sort_rows(){

    if (first_time) {return}

    // remove all but three rows
    Array.from(tableElement.children).slice(3).forEach(element => {element.remove();});

    // long function,
    // but all it does is return which number checkbox is selected
    let sort_index = Array.from(document.querySelectorAll("#sort-row input")).indexOf(document.querySelector("#sort-row input:checked"));
    
    // list of what each checkbox refers to
    let sort_values = ["Store Name","Banana Price (lb)","Strawberry Price (oz)","Apple Price (oz)","Potato Price (lb)","Onion Price (lb)","Tomato Price (lb)"];

    console.log(`Sorting by ${sort_values[sort_index]}`);

    prices_json = sortJson(prices_json,sort_values[sort_index]);

    await render_rows(prices_json);

    filter_rows();
}

// Function to debounce other functions
function debounce(func, delay) {
    let timeoutId; // create variable to store the timeout id
    // create a function that is returned and executed after the debounce
    return function(...args) {
        clearTimeout(timeoutId); // clear existing timeouts
        // set a new timeout to delay the execution of the function
        timeoutId = setTimeout(() => {
            func.apply(this, args); // execute the function
        }, delay); // delay is the specified time interval
    };
}

// Functon for levenstein distance
// Basically calculates how different two strings are
// Take from https://stackoverflow.com/questions/11919065/sort-an-array-by-the-levenshtein-distance-with-best-performance-in-javascript
var levDist = function(s, t, starts=false) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n == 0) return m;
    if (m == 0) return n;

    //Create an array of arrays in javascript (a descending loop is quicker)
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
        var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    // extra step that i added
    // raises distance if it they dont start with eachother 
    if (!(s.toLowerCase().startsWith(t.toLowerCase()) || t.toLowerCase().startsWith(s.toLowerCase())) && starts){
        d[n][m]+=10;
    }

    // Step 7
    return d[n][m];
}
// if you wish to understand this function better
// https://medium.com/@ethannam/understanding-the-levenshtein-distance-equation-for-beginners-c4285a5604f0
// https://en.wikipedia.org/wiki/Levenshtein_distance
// otherwise the algorithm uses a matrix to figure out the amount of edits needed to change one string into the other

function start_autocomplete(){
    var inp = document.getElementById("storenamesearch"); // Load the text input

    // Load the autocomplete container element
    var autocomplete_container = document.getElementById("autocomplete_menu");

    inp.addEventListener("input", debounce((e)=>{
        // clear the container
        autocomplete_container.innerHTML="";
        
        var val = inp.value; // get the inputted value


        // function to compare the levenshtein distances
        // for sorting
        const levCompare = (a, b) => {
            let a_dist = levDist(a, val, true);
            let b_dist = levDist(b, val, true);
            if (a_dist > b_dist){
                return 1;
            } else if (a_dist === b_dist) {
                return 0;
            } else {
                return -1;
            }
        }

        let sorted_store_names = store_names.sort(); // first sort alphabetically
        sorted_store_names = store_names.sort(levCompare); // then sort based on levenshtein

        sorted_store_names.forEach(name => { // loop over every store name
            if (val.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(val.toLowerCase())){ // if the store name starts with what the user entered

                // create a div to store it
                let item = document.createElement("div");
                item.classList.add("autocomplete_item"); // add proper classes
                item.innerHTML=`<p>${name}</p>` // add the text

                // add an event listener
                // when the option is selected
                item.addEventListener("click", e => {
                    inp.value=name; // set value to whatever name it was
                    autocomplete_container.innerHTML=""; // clear the autocomplete
                    filter_rows(); // filter the rows based on what was selected
                });
                autocomplete_container.appendChild(item); // add the item to the autocomplete container
            }
        })

        sort_rows(); // re sort the rows
        filter_rows(); // refilter the rows
        // as you type it will automatically change
    },250));

    // if the user clicks away then remove the autocomplete
    document.addEventListener("click", function (e) {
        autocomplete_container.innerHTML=""; // empty the autocomplete container
        
        // also remove the dropdown content
        if (!e.target.matches('.dropdownbutton')) { // if the dropwdown wasnt clicked
            document.querySelectorAll(".dropdown-content").forEach(dropdown => {
                dropdown.classList.remove('show'); // loop over all content and hide it
            });
            // this is a loop in case more dropdowns are added
        }
    });
}

function toggle_dropdown(){
    // open and close the dropdown menu
    document.getElementById("dropdown-content").classList.toggle("show");
}

// the divs containing the checkboxes for fruit and vegetable
const fruit_selector = document.getElementById("fruit_selector");
const vegetable_selector = document.getElementById("vegetable_selector");

function update_dropdown(number){
    producetype=parseInt(number); // convert to integer

    // change the text of the drop down button to match whatever the user chose
    document.getElementById("dropdownbutton").innerText = ["","All Produce","Fruit only","Vegetable only"][producetype];

    // make all checkboxes checked
    document.querySelectorAll(".produce_selector input").forEach((input) => {
        input.checked=true;
    })

    // Hide or show checkboxes based on produce type
    if (producetype === 1){ // all produce
        fruit_selector.classList.add("show");
        vegetable_selector.classList.add("show");
    } else if (producetype === 2){ // fruits only
        fruit_selector.classList.add("show");
        vegetable_selector.classList.remove("show");
    } else if (producetype === 3){ // vegetables only
        fruit_selector.classList.remove("show");
        vegetable_selector.classList.add("show");
    }

    // refilter the rows for instant effect
    filter_rows();
}

// Function that checks if user is on mobile
window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

var onmobile = window.mobileCheck();

if (!onmobile){
    // alert("Notice: This website is built for mobile, and it seems like you using a different device. The website will work, however the design may be off.")
    console.log("not on mobile");
}