import { Component, OnInit, Inject, Pipe, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { FormGroup, Validators, FormBuilder, FormControl, FormArray } from '@angular/forms';

import { EmployeeService } from '@app/modules/employee/services';
import { Employee } from '@app/modules/employee/models';

import { first } from 'rxjs/operators';
import * as moment from 'moment';

export const MY_FORMATS = {
	parse: {
		dateInput: 'DD-MM-YYYY'
	},
	display: {
		dateInput: 'DD-MM-YYYY',
		monthYearLabel: 'DD-MM-YYYY',
		dateA11yLabel: 'LL',
		monthYearA11Label: 'DD-MM-YYYY'
	}
};

@Component({
  selector: 'app-employee-dialog',
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.css'],
  providers: [
	  /*
		`MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your 
		application's root module.
	  */
	  {
		  provide: DateAdapter,
		  useClass: MomentDateAdapter,
		  deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
	  },
	  {
		  provide: MAT_DATE_FORMATS,
		  useValue: MY_FORMATS
	  }
  ]
})
export class EmployeeDialogComponent implements OnInit {

	employeeForm: FormGroup;
	public mode = "";
	public modeFlag: boolean = false;
	minDate: Date;
	maxDate: Date;
	@ViewChild('datemask', {static: false}) input;
	address = new FormArray([]);
	employeeInfo: any = {}
	tabs = ['Residant Address', 'Officce Address'];
	step = 0;

	constructor(
		private formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: any, // Define data object to overcome undefined error
		public dialogRef: MatDialogRef<EmployeeDialogComponent>,
		private employeeService: EmployeeService) {
			let now: Date = new Date();
			this.minDate = new Date(now.getFullYear() - 69, now.getMonth(), now.getDate());
			this.maxDate = new Date(now.getFullYear() - 19, now.getMonth(), now.getDate());
			this.employeeInfo = this.data;
			console.log("this.employeeInfo<<<<<<<<<<<<<<<<<<<",this.employeeInfo)			
   }

  ngOnInit() {  
	  if(this.mode === "view") {
		this.modeFlag = true;
	  }
	  
	  this.employeeForm = this.formBuilder.group({ 
			id: [{ value: '', disabled: this.modeFlag }],
			firstName: [{ value: '', disabled: this.modeFlag }, [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
			lastName: [{ value: '', disabled: this.modeFlag }, [Validators.required]],
			dob: [{ value: '', disabled: this.modeFlag }, [Validators.required]],
			mobilePhone: [{ value: '', disabled: this.modeFlag },[Validators.required,Validators.pattern('^[0-9]{10}$'), Validators.minLength(10), Validators.maxLength(10)]],
			email: [{ value: '', disabled: this.modeFlag }, [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$')]],
			company: [{ value: '', disabled: this.modeFlag }],
			jobTitle: [{ value: '', disabled: this.modeFlag }],
			address: new FormArray([
				new FormGroup({
					country: new FormControl(''),
					state: new FormControl(''),
					city: new FormControl(''),
					street: new FormControl('')
				}),
				new FormGroup({
					country: new FormControl(''),
					state: new FormControl(''),
					city: new FormControl(''),
					street: new FormControl('')
				})
			])			
		});
console.log('this.employeeInfo',this.employeeInfo)
		this.address = this.employeeForm.get('address') as FormArray;
		if(this.employeeInfo != null) {
			this.employeeInfo.address.forEach((field, index) => {
				/*let faControl = (<FormArray>this.employeeForm.controls['address']).at(index);
				faControl.get('country').setValue(this.employeeInfo.address[+index].country);
				faControl.get('city').setValue(this.employeeInfo.address[index].state);
				faControl.get('state').setValue(this.employeeInfo.address[index].city);
				faControl.get('street').setValue(this.employeeInfo.address[index].street);*/
								
				this.address.controls[index].get("country").setValue(this.employeeInfo.address[index].country);
				this.address.controls[index].get("state").setValue(this.employeeInfo.address[index].state);
				this.address.controls[index].get("city").setValue(this.employeeInfo.address[index].city);
				this.address.controls[index].get("street").setValue(this.employeeInfo.address[index].street);				
			  })
		}		
  }

  closeDialog(){	
    this.dialogRef.close({event:'Close'});
  }
  
  update(employee) {
	console.log("update:::",employee)
	// stop here if form is invalid
	if (this.employeeForm.invalid) {
		return;
	}
	
	this.address.controls.forEach((field, index) => {
		if(employee.address[index] != undefined) {
			employee.address[index].country = field.get('country').value;
			employee.address[index].state = field.get('state').value;
			employee.address[index].city = field.get('city').value;
			employee.address[index].street = field.get('street').value;
		} else {
			if(field.get('country').value != '') {
				employee.address.push({id:"",country: field.get('country').value,
					state: field.get('state').value,
					city: field.get('city').value,
					street: field.get('street').value
				});
			}
		}
	});
	
	this.employeeService.update(employee).pipe().subscribe(employee => {	
			this.dialogRef.close({event:'Update',data:employee.responseValue});		
		}, err => {
			console.log('err',err);
			//this.error = err;
		});
  }
  
  add(employee) {  
	  console.log("Add:::",employee)
	// stop here if form is invalid
	if (this.employeeForm.invalid) {
		return;
	}
	console.log("employee.address:",employee.address)
	this.address.controls.forEach((field, index) => {
		if(field.get('country').value != '') {
			employee.address.push({
				id:"",
				country: field.get('country').value,
				state: field.get('state').value,
				city: field.get('city').value,
				street: field.get('street').value
			});
		}		
	});
	employee.status = "Active";
	this.employeeService.add(employee).pipe().subscribe(employee => {			
			this.dialogRef.close({event:'Add',data:employee.responseValue});
		}, err => {
			console.log('err',err);
			//this.error = err;
		});
  }

  public onChange(event: any): void {
	  console.log("onchange")
	  /*console.log("yyyy:",moment(this.employeeForm.get('dob').value,"YYYY-MM-DD h:m:s").format("DD-MM-YYYY"))
	  if(moment(this.employeeForm.get('dob').value,"YYYY-MM-DD h:m:s").format("DD-MM-YYYY") != "Invalid date") {
		this.input.nativeElement.value = moment(this.employeeForm.get('dob').value,"YYYY-MM-DD h:m:s").format("DD-MM-YYYY");
	  }*/
	  console.log(event)
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    } else {
      setTimeout(() => {
        var len = this.input.nativeElement.value.length
        console.log(len)
        if (len !== 1 || len !== 3) {
          if (event.keyCode == 47) {
            event.preventDefault();
          }
        }
        // If they don't add the slash, do it for them...
        if (len === 2) {
          if (this.input.nativeElement.value > 31 || this.input.nativeElement.value < 1) {
            this.input.nativeElement.value = ''
            event.preventDefault();
          } else {
            this.input.nativeElement.value += '-';
          }
        }
        // If they don't add the slash, do it for them...
        if (len === 5) {
          var str = String(this.input.nativeElement.value).split("-")
          console.log(str)
          if (str.length > 1) {
            let val = Number(str[1])
            if (val > 12 || val < 1) {
              this.input.nativeElement.value = str[0] + '-'
              event.preventDefault();
            } else {
              this.input.nativeElement.value += '-';
            }
          }
        }
        if (len === 10) {
          var str = String(this.input.nativeElement.value).split("-")
          if (str.length > 1) {
            let val = Number(str[2])
            console.log('valval', val, this.maxDate.getFullYear())
            //if (val > 2019) {
            if (val > this.maxDate.getFullYear()) {
              this.input.nativeElement.value = str[0] + '-' + str[1] + '-'
              event.preventDefault();
            } else {
              //this.input.nativeElement.value = ''; 
            }
          }
        }
        // }
      }, 50);
    }
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}
