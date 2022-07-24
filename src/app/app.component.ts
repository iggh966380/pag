import { Component, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';

export interface Data { name: string, payload?: any, id?: string, img: string };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('Input') input: ElementRef | undefined;
  title = 'pag';
  private girlDataCollection: AngularFirestoreCollection<Data>;
  data: Observable<Data[]>;
  singleData!: Observable<Data>;
  name: string = '';
  isStartDraw: boolean = false;
  pick: string = '';
  timer: any;
  endingText: string = '';
  gameEnd: boolean = false;
  itemDoc!: AngularFirestoreDocument<Data>;
  downloadURL: string = '';
  pickImg: string = '';
  constructor(private firestore: AngularFirestore, private storage: AngularFireStorage) {
    this.girlDataCollection = firestore.collection('data');
    this.data = this.girlDataCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const fetchedData = a.payload.doc.data();
        const id = a.payload.doc.id;
        return { id, ...fetchedData };
      }))
    )
  }

  ngOnInit() {}

  addData() {
    const newData: Data = { name: '', img: '' };
    newData.name = this.input?.nativeElement.value;
    newData.img = this.downloadURL;
    this.girlDataCollection.add(newData);
  }

  getRandomData() {
    this.isStartDraw = true;
    this.data.subscribe((ele: Data[]) => {
      let count = 100;
      let i = 0;
      this.setInterval(ele, count);
      const aTimer = setInterval(() => {
        i++;
        if (i % 200 === 0) {
          if (count < 600) {
            count += 100;
            clearInterval(this.timer);
            this.setInterval(ele, count);
          }
        }

        if (i === 3000) {
          clearInterval(aTimer);
          clearInterval(this.timer);
          this.gameEnd = true;
          this.showEndingText();
        }
      }, 1);
    })
  }

  setInterval(ele: Data[], count: number) {
    let randNum = 0;
    this.timer = setInterval(() => {
      randNum = Math.floor(Math.random() * ele.length);
      this.pick = ele[randNum].name;
      this.pickImg = ele[randNum].img;
    }, count)
  }

  showEndingText() {
    this.isStartDraw = false;
    this.endingText = `今晚的妹妹是${ this.pick }`;
  }

  delData(id: string | undefined) {
    this.itemDoc = this.firestore.doc(`data/${id}`);
    this.itemDoc.delete();
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    const filePath = `${Math.floor(Math.random() * 100)}${file.name}`;
    const task = this.storage.upload(`data/${filePath}`, file);
    const percent = task.percentageChanges();
    task.snapshotChanges().pipe(finalize(() => {
      const url = this.storage.ref(`data/${filePath}`).getDownloadURL();
      url.subscribe(ele => {
        this.downloadURL = ele;
      })
    })).subscribe()
  }
}
