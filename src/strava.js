const auth_link = "https://www.strava.com/oauth/token"

function fetchData(link){
  return fetch(link)
    .then(res => {
      return res.json();
    })
}

function createAccordionItem(title, content) {
    const item = document.createElement('div');
    item.classList.add('accordion-item');

    const header = document.createElement('div');
    header.classList.add('accordion-item-header');
    header.textContent = title;
    header.addEventListener('click', () => toggleAccordionContent(contentDiv));

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('accordion-item-content');
    contentDiv.textContent = content;

    item.appendChild(header);
    item.appendChild(contentDiv);

    return item;
  }

  // Function to toggle accordion content visibility
  function toggleAccordionContent(contentDiv) {
    contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
  }

  // Function to initialize the accordion
  function initializeAccordion(containerId, data) {
    const accordionContainer = document.getElementById(containerId);
    console.log(data)
    data.forEach(itemData => {
      var title = itemData.name + " - " + itemData.start_date;
      var type = itemData.sport_type;
      if (type = "Run"){
        const accordionItem = createAccordionItem(title, itemData.distance);
        accordionContainer.appendChild(accordionItem);
      }
    });
  }

  function processArray(res, arrayData) {
    var segments = [];
    arrayData.forEach(item => {
      const segments_link = `https://www.strava.com/api/v3/activities/${item.id}?access_token=${res.access_token}`
      var segment = fetchData(segments_link));
      segments.push(segment);
    });
    return segments;
  }

  function loopActivities(res){
    const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}`
    fetchData(activities_link)
      .then(activities => {
        Promise.all(processArray(res, activities))
        .then((results) => {
          console.log(results);
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
