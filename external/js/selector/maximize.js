$(document).ready(function(){
	var campaigns = document.getElementById("campaigns");
	$(campaigns).append(localStorage.getItem("campaigns"));
	/**/
	var page_header = document.getElementById('page-header')
	var page_footer = document.getElementById('page-footer')
	$.getJSON("/config.json", function (data){
		page_header.style.setProperty('--background-color', data.maximize.color.header)
		page_footer.style.setProperty('--background-color', data.maximize.color.header)
	})
	.fail(function(){
		console.log("Error Loading Json!");
	});	
});