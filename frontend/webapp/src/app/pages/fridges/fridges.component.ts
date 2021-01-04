import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-fridges',
  templateUrl: './fridges.component.html',
  styleUrls: ['./fridges.component.scss']
})
export class FridgesComponent implements OnInit {

  // title = 'webapp';
  url = `http://localhost:3000/fridges`;
  items = [];
  fridges = [];
  configured = [];
  userId = { userId: 3 };
  constructor(private http: HttpClient) {
    this.http.post(this.url + '/ByUser', this.userId).toPromise().then(data => {
      console.log(data);
      for (let key in data)
        if (data.hasOwnProperty(key))
          if (data[key]['name'] != null) {
            this.fridges.push([data[key]['name'], true]);
            // this.fridges.push([data[key]['_id'] + ": " + data[key]['name'], true]);
          }
          else {
            this.fridges.push([data[key]['_id'] + ": Kühlschrank wurde noch nicht definiert", false]);
          }
    })
  }

  ngOnInit() {
  }

}
