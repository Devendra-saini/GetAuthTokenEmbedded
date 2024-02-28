// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

let models = window["powerbi-client"].models;
let reportContainer = $("#report-container").get(0);
let report;
let reportId;
// Initialize iframe for embedding report
powerbi.bootstrap(reportContainer, { type: "report" });

// AJAX request to get the report details from the API and pass it to the UI
$.ajax({
    type: "GET",
    url: "/getEmbedToken",
    dataType: "json",
    success: async function (embedData) {

        // Create a config object with type of the object, Embed details and Token Type
        let permissions = models.Permissions.All;
        let reportLoadConfig = {
            type: "report",
            tokenType: models.TokenType.Embed,
            accessToken: embedData.accessToken,

            // Use other embed report config based on the requirement. We have used the first one for demo purpose
            embedUrl: embedData.embedUrl[0].embedUrl,
            permissions:permissions,
           
        settings: { bars: {             actionBar: {                 visible:true         }         }     }

            // Enable this setting to remove gray shoulders from embedded report
            // settings: {
            //     background: models.BackgroundType.Transparent
            // }
        };

        // Use the token expiry to regenerate Embed token for seamless end user experience
        // Refer https://aka.ms/RefreshEmbedToken
        tokenExpiry = embedData.expiry;

        // Embed Power BI report when Access token and Embed URL are available
         report = powerbi.embed(reportContainer, reportLoadConfig);

        // Clear any other loaded handler events
        report.off("loaded");

        // Triggers when a report schema is successfully loaded
        report.on("loaded", async function () {
            console.log("Report load successful");
            const pages = await report.getPages();

            // Retrieve active page
            const activePage = pages.filter(function (page) {
                return page.isActive
            })[0];
            $("#Page-title").html(activePage.displayName);
             console.log("active page is ",activePage.displayName);
             const pagess = await report.getPages();
    // Retrieve the page that contain the visual. For the sample report it will be the active page
    let page = pagess.filter(function (page) {
        return page.isActive
    })[0];

    const visuals = await page.getVisuals();
    console.log(
        visuals.map(function (visual) {
            return {
                name: visual.name,
                type: visual.type,
                title: visual.title,
                layout: visual.layout
            };
        }));
             
            
        });
       // Retrieve the page collection and get the visuals for the active page.

    



        // Clear any other rendered handler events
        report.off("rendered");

        // Triggers when a report is successfully embedded in UI
        report.on("rendered",async function () {
            console.log("Report render successful");
            reportId = report.getId();
           
            // getreportinfo();
        });
        report.on("pageChanged", function (event) {
            let page = event.detail.newPage;
            $("#Page-title").html(page.displayName); 
        });
        // Clear any other error handler events
        report.off("error");

        // Handle embed errors
        report.on("error", function (event) {
            let errorMsg = event.detail;
            console.error(errorMsg);
            return;
        });
      
        

    },

    error: function (err) {

        // Show error container
        console.log(" something went wrong")
        let errorContainer = $(".error-container");
        $(".embed-container").hide();
        errorContainer.show();

        // Get the error message from err object
        let errMsg = JSON.parse(err.responseText)['error'];

        // Split the message with \r\n delimiter to get the errors from the error message
        let errorLines = errMsg.split("\r\n");

        // Create error header
        let errHeader = document.createElement("p");
        let strong = document.createElement("strong");
        let node = document.createTextNode("Error Details:");

        // Get the error container
        let errContainer = errorContainer.get(0);

        // Add the error header in the container
        strong.appendChild(node);
        errHeader.appendChild(strong);
        errContainer.appendChild(errHeader);

        // Create <p> as per the length of the array and append them to the container
        errorLines.forEach(element => {
            let errorContent = document.createElement("p");
            let node = document.createTextNode(element);
            errorContent.appendChild(node);
            errContainer.appendChild(errorContent);
        });
    }
});

console.log("report id",reportId)
const PrintReport =$("#print-report");
PrintReport.on("click",function () {
    report.print();
});
$("#edit-mode").on("click",function(){
    report.switchMode("edit");
})
$("#view-mode").on("click",function(){
    report.switchMode("view");
})
function getValue(){
    var inputValue = $('#fname').val(); 
    console.log("file naem is ",inputValue);
    let saveAsParameters = {
        name: inputValue
    };
      report.saveAs(saveAsParameters);
      $("#input-field").hide();


}
$("#save-as-report").on("click",function(){
    let saveAsParameters = {
        name: "newReport5"
    };
    $("#input-field").show();
    
    // SaveAs report
    // Note: The sample report can’t be saved.
    // report.saveAs(saveAsParameters);
})
$("#authoring-page").on("click",async function(){

    try {
        const pageName = "Authoring page";
        if (window.authoringPage) {
            console.log(pageName + " already exists.")
            await authoringPage.setActive();
            return;
        }
    
        // Adds a new page for the authoring APIs
        window.authoringPage = await report.addPage(pageName);
        console.log("A new page for the authoring APIs was created, next step would be to use the 'Create a visual' API");
    } catch (errors) {
        console.log(errors);
    }
    
})
$("#delete-authoring-page").on("click", async function(){

    if (!window.authoringPage) {
        console.log("Authoring page is undefined. Please run 'Create an authoring page' first.");
    } else {
        try {
            // Get required page name.
            const pageName = window.authoringPage.name;
    
            // Delete the page.
            await report.deletePage(pageName);
            console.log("Existing authoring page with name \"" + pageName + "\" has been deleted.");
            window.authoringPage = undefined;
    
            const pages = await report.getPages();
    
            // Get the visible pages in view mode.
            const visiblePages = pages.filter((page) => page.visibility == 0);
    
            if (visiblePages.length > 0) {
                await visiblePages[0].setActive();
            }
        }
        catch (errors) {
            console.log(errors);
        }
    }
    
})
$("#create-authoring-page").on("click",async function (){
    if (!window.authoringPage) {
        console.log("Authoring page is undefined. Please run 'Create an authoring page' first.");
    } else {
        // Creating new visual
        // For more information about report authoring, see https://go.microsoft.com/fwlink/?linkid=2153366
        try {
            await window.authoringPage.setActive();
            const response = await window.authoringPage.createVisual('clusteredColumnChart');
            window.lastCreatedVisual = response.visual;
    
            // Defining data fields
            const regionColumn = { column: 'Country/Region', table: 'Country Region', schema: 'http://powerbi.com/product/schema#column' };
            const totalUnitsMeasure = { measure: 'Actual', table: 'Fact', schema: 'http://powerbi.com/product/schema#measure' };
            // const totalVanArsdelUnitsMeasure = { measure: 'Total VanArsdel Units', table: 'SalesFact', schema: 'http://powerbi.com/product/schema#measure' };
    
            // Adding visual data fields
            window.lastCreatedVisual.addDataField('Category', regionColumn);
            window.lastCreatedVisual.addDataField('Y', totalUnitsMeasure);
            // window.lastCreatedVisual.addDataField('Y', totalVanArsdelUnitsMeasure);
        }
        catch (errors) {
            console.log(errors);
        }
    }
})
$("#change-visual").on("click", async function(){

    await window.authoringPage.setActive();
    await window.lastCreatedVisual.changeType('pieChart');

    // When caching the visual object, you need to manually update the visual type
    window.lastCreatedVisual.type = 'pieChart';
})
// async function getreportinfo(){
//     $.ajax({
//         url: `https://api.powerbi.com/v1.0/myorg/reports/${reportId}/pages`,
//         method: 'GET',
//         dataType: "json",
//         success: function(response) {
//           console.log('GetPages API Response:', response);
//           // Handle the response data here
//         },
//         error: function(xhr, status, error) {
//           console.error('Error calling GetPages API:', error);
//         }
//       });

// }