$(document).ready(function(){
	var jsonVars = document.getElementById('livechat-minified-container')
	var short_message = document.getElementById('short-message')
	$.getJSON("/config.json", function (data){
		jsonVars.style.setProperty('--header-color', data.color.index.main)
		short_message.style.setProperty('--text-color', data.color.index.text)
		$("#short-message").append(data.label.main)
	})
	.fail(function(){
		console.log("Error Loading Json!");
	});
});
function prueba(){
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
}