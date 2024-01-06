function minTommss(minutes){
 var sign = minutes < 0 ? "-" : "";
 var min = Math.floor(Math.abs(minutes));
 var sec = Math.floor((Math.abs(minutes) * 60) % 60);
 return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
}


function getProjectedFiveKilo(time){
     return (time * 0.621371) * 5;
}

function getAverageMinutePerMile(distance, time){
     return 26.8224 / (distance / time);
}


function createDropdown(jsonArray, id) {
  const dropdown = document.createElement('select');
  dropdown.multiple = true;
  dropdown.id = id + "_dropdown";
  for (const lap of jsonArray) {
    const option = document.createElement('option');
    option.value = lap.name;
    option.text = lap.name;
    dropdown.appendChild(option);
}
dropdown.addEventListener('change', function () {
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
    avgTime = getAverageMinutePerMile(sumDistance, sumTime);
    projectedFiveKm = getProjectedFiveKilo(avgTime);
    outputDiv.innerHTML = `Average Minute/Mile: ${minTommss(avgTime)} <br> Predicted 5KM: ${minTommss(projectedFiveKm)}`;
});
return dropdown;
}

function createDivs(jsonArray, contentDiv, id) {
  jsonArray.forEach(item => {
    const div = document.createElement('div');
    div.innerHTML = `${item.name}: <br> Distance: ${item.distance} <br> Time: ${item.elapsed_time}`;
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

  function toggleAccordionContent(contentDiv) {
    contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
  }

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

function main(){
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
        .then(results => {
              initializeAccordion('accordionContainer', results);
            })
  }

main()
