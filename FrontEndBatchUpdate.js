var addCheckboxes = function(view) {

// add the checkbox to to the header to select/unselect all
$('#' + view.key + '.kn-table thead tr').prepend('<th><input type="checkbox"></th>');

$('#' + view.key + '.kn-table thead input').change(function() {
$('.' + view.key + '.kn-table tbody tr input').each(function() {
$(this).attr('checked', $('#' + view.key + '.kn-table thead input').attr('checked') != undefined);
});
});

// add a checkbox to each row in the table body
$('#' + view.key + '.kn-table tbody tr').each(function() {
$(this).prepend('<td><input type="checkbox"></td>');
});
}


/**** CHANGE VIEW_ID TO YOUR OWN VIEW ID ****/
$(document).on('knack-view-render.view_395', function(event, view) {

// Add an update button
$('<button id="update"">Top Shelf These Fools</button>').insertAfter('.view-header');

// Add checkboxes to our table
addCheckboxes(view);

// Click event for the update button
$('#update').click(function() {

// We need an array of record IDs
var record_ids = [];

// Populate the record IDs using all checked rows
$('#' + view.key + ' tbody input[type=checkbox]:checked').each(function() {
record_ids.push($(this).closest('tr').attr('id')); // record id
});

Knack.showSpinner();

// Define the fields you want to update
var data = {
field_212: 'Top Shelf',
};

// seet the delay to prevent hitting API rate limit (milliseconds)
var myDelay = 100;

//call updateRecords function
$(function() {
updateRecords(record_ids.shift(), record_ids, data);
});

var selectedRecords = record_ids.length + 1
function updateRecords(id, records, data) {

$.ajax({
//CHANGE OBJECT_ID TO YOUR OWN OBJECT ID
url: 'https://api.knackhq.com/v1/objects/object_XX/records/' + id,
type: 'PUT',
/***** CHANGE TO YOUR OWN APPID AND API KEY HERE *****/
headers: {
'X-Knack-Application-ID': 'APPID',
'X-Knack-REST-API-Key': 'API KEY'
},
data: data,
success: function(response) {
if (record_ids.length > 0) {
// Every time a call is made, the array is shifted by 1.
// If the array still has a length, re-run updateRecords()
setTimeout(updateRecords(record_ids.shift(), record_ids, data), myDelay);
} else {
alert(selectedRecords + " Updated");
Knack.hideSpinner();
location.reload();
}
}
})
}
})
});
