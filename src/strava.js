const auth_link = "https://www.strava.com/oauth/token"

function fetchData(link){
  return fetch(link)
    .then(res => {
      return res.json();
    })
}

function createDropdown(jsonArray, id) {
  const dropdown = document.createElement('select');
  dropdown.multiple = true;
  dropdown.id = id + "_dropdown";
  for (const lap of jsonArray) {
    const option = document.createElement('option');
    option.value = lap.name;
    option.text = lap.name; // Example text based on the value
    dropdown.appendChild(option);
}
dropdown.addEventListener('change', function () {
    // Get the selected values
    const selectedValues = Array.from(this.selectedOptions, option => option.value);
    let sumTime = 0
    let sumDistance = 0
    jsonArray.forEach(item => {
      if (selectedValues.includes(item.name)) {
        sumTime += item.elapsed_time;
        sumDistance += item.distance;
      }
    })
    var outputDiv = document.getElementById(id + "_result")
    outputDiv.innerHTML = 26.8224 / (sumDistance / sumTime);
});
return dropdown;
}

function createDivs(jsonArray, contentDiv, id) {
  // Loop through the array
  jsonArray.forEach(item => {
    // Create a div element
    const div = document.createElement('div');

    // Set content or attributes based on JSON properties
    div.innerHTML = `${item.name}: <br> Distance: ${item.distance} <br> Time: ${item.elapsed_time}`;

    // Append the div to the container
    contentDiv.appendChild(div);
  });
  contentDiv.appendChild(createDropdown(jsonArray, id))
  return contentDiv;
}


function createAccordionItem(title, contentArray, id) {
    const item = document.createElement('div');
    item.classList.add('accordion-item');

    const header = document.createElement('div');
    header.classList.add('accordion-item-header');
    header.textContent = title;
    header.addEventListener('click', () => toggleAccordionContent(contentDiv));

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('accordion-item-content');

    item.appendChild(header);
    const result = document.createElement("div")
    let result_id = id + "_result";
    result.id = result_id;
    item.appendChild(createDivs(contentArray, contentDiv, id));
    item.appendChild(result)

    return item;
  }

  // Function to toggle accordion content visibility
  function toggleAccordionContent(contentDiv) {
    contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
  }

  // Function to initialize the accordion
  function initializeAccordion(containerId, data) {
    const accordionContainer = document.getElementById(containerId);

    data.forEach(itemData => {
      var title = itemData.name + " - " + itemData.start_date;
      var laps = itemData.laps;
      let id = itemData.id.toString();
      const accordionItem = createAccordionItem(title, laps, id);
      accordionContainer.appendChild(accordionItem);
    });
  }

  function processArray(res, arrayData) {
    var segments = [];
    arrayData.forEach(item => {
      var type = item.sport_type;
      if (type == "Run"){
        const segments_link = `https://www.strava.com/api/v3/activities/${item.id}?access_token=${res.access_token}`
        var segment = fetchData(segments_link);
        segments.push(segment);
      }
    });
    return segments;
  }

  function loopActivities(res){
    const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}`
    fetchData(activities_link)
      .then(activities => {
        Promise.all(processArray(res, activities))
        .then((results) => {
          initializeAccordion('accordionContainer', results);
        })
      })
  }


function reAuthorize(){
  fetch(auth_link, {
    method: 'post',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: '117229',
      client_secret: '5b8c670ec58fcf63de142afae6dc51ee854196a0',
      refresh_token: 'f2adec1c764e6c9e3b368ad05780a359f54421b3',
      grant_type: 'refresh_token'
    })
  }).then((res) => (res.json()))
      .then(res => loopActivities(res))
}

reAuthorize()
