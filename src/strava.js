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

function main(){
    fetch('http://127.0.0.1:5000/api/data')
      .then(res => res.json())
        .then(results => {
              initializeAccordion('accordionContainer', results);
            })
  }

main()
