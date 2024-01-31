class BuildUI {

    constructor(activities, laps) {
        this.activities = activities;
        this.laps = laps;
    }

    createDropdown(jsonArray, id) {
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

        function minTommss(minutes){
            var sign = minutes < 0 ? "-" : "";
            var min = Math.floor(Math.abs(minutes));
            var sec = Math.floor((Math.abs(minutes) * 60) % 60);
            return sign + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
        }

        function secondsToMinutesAndSeconds(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            // Use string interpolation or concatenation to format the result
            const formattedTime = `${minutes}:${remainingSeconds}`;

            return formattedTime;
        }

        let avgTime = 26.8224 / (sumDistance / sumTime);
        const projectedFiveKm = (avgTime * 0.621371) * 5;
        outputDiv.innerHTML = `Average Minute/Mile: ${minTommss(avgTime)} <br> Predicted 5KM: ${minTommss(projectedFiveKm)} <br> Total Distance: ${sumDistance} <br> Total Time: ${secondsToMinutesAndSeconds(sumTime)}`;
    });
    return dropdown;
    }

    createDivs(jsonArray, contentDiv, id) {
      jsonArray.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `${item.name}: <br> Distance: ${item.distance} <br> Time: ${item.elapsed_time}`;
        contentDiv.appendChild(div);
      });
      contentDiv.appendChild(this.createDropdown(jsonArray, id))
      return contentDiv;
    }


    createAccordionItem(title, contentArray, id) {
        const item = document.createElement('div');
        item.classList.add('accordion-item');

        const header = document.createElement('div');
        header.classList.add('accordion-item-header');
        header.textContent = title;
        header.addEventListener('click', () => this.toggleAccordionContent(contentDiv));

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('accordion-item-content');

        item.appendChild(header);
        const result = document.createElement("div")
        let result_id = id + "_result";
        result.id = result_id;
        item.appendChild(this.createDivs(contentArray, contentDiv, id));
        item.appendChild(result)

        return item;
    }

    toggleAccordionContent(contentDiv) {
        contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
    }

    initializeAccordion(containerId) {
        const accordionContainer = document.getElementById(containerId);

        this.activities.forEach(itemData => {
          var title = itemData.name + " - " + itemData.start_date;
          const laps = this.laps.filter(obj => obj.id === itemData.id);
          console.log(laps);
          if (itemData.type == "Run") {
             const accordionItem = this.createAccordionItem(title, laps, itemData.id);
             accordionContainer.appendChild(accordionItem);
          }
        });
      }
    }


async function main() {
    const url1 = "http://localhost:8000/api/activities";
    const url2 = "http://localhost:8000/api/laps";

    const responses = await Promise.all([fetch(url1), fetch(url2)])

    const userActivities = await responses[0].json()
    const userLaps = await responses[1].json()
    const buildUi = new BuildUI(userActivities, userLaps);
    buildUi.initializeAccordion('accordionContainer')
  }

main()
