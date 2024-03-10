/**
 * @jest-environment jsdom
 */
import {expect, jest, test} from '@jest/globals';
import { screen, fireEvent, createEvent } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { bills } from '../fixtures/bills.js';
import router from "../app/Router";

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page and I select a file with a valid extension (jpg, jpeg, png)', () => {
    test('Then the system should continue with processing the file', () => {
      // Arrange: Set up common conditions for the test with a valid file
      document.body.innerHTML = NewBillUI();
      const fileInput = screen.getByTestId('file');
    
      // Mock a file with the specified name and type
      const file = new File(['(content)'], "test.jpg", { type: "jpg" });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });
    
      // Mock localStorage for the file upload
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }));
    
      // Path to route files (Router.js),(routes.js)
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    
      // Capture instances of NewBill for configuring callbacks during testing
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Act: Trigger the change event
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e,fileInput.files[0].name));
      fileInput.addEventListener("change", handleChangeFile)
      fireEvent.change(fileInput);

      
      // Assert: Check if the file input is correctly handled
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files[0].name).toEqual('test.jpg');
    });
  });

  describe('When I am on NewBill Page and I select a file with an invalid extension', () => {
     beforeEach(() => {
      // Mock console.error and alert
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(global, 'alert').mockImplementation(() => {});
    })
    test('Then the system should display an error message', async () => {
    // Arrange: Set up common conditions for the test with a valid file
      document.body.innerHTML = NewBillUI();
      const fileInput = screen.getByTestId('file');
    
      // Mock a file with the specified name and type
      const file = new File(['(content)'], "test.txt", { type: "text/plain" });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });
    
      // Mock localStorage for the file upload
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }));
    
      // Path to route files (Router.js),(routes.js)
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    
      // Capture instances of NewBill for configuring callbacks during testing
        new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
      });

       // Act: Trigger the change event
        fireEvent.change(screen.getByTestId('file'));
      
      // Assert: Check if the file input is correctly handled
        expect(console.error).toHaveBeenCalledWith('Extension de fichier non autorisée. Les extensions autorisées sont :jpg, jpeg, png');
        expect(window.alert).toHaveBeenCalledWith('Extension de fichier non autorisée. Les extensions autorisées sont :jpg, jpeg, png');
        expect(screen.getByTestId('file').value).toEqual('');
    });
  });

  describe('When I am on NewBill Page and I submit the form', () => {
   beforeEach(() => {

      // Mock localStorage for the file upload
        Object.defineProperty(
         window,
         'localStorage', 
         { value: localStorageMock });
          
         window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee',
         email: 'user@example.com',
        }));
       
        document.body.innerHTML = NewBillUI();
       
    });

    test('It should send the bill on valid submission', () => {
       // Arrange: Set up common conditions for the test with a valid file
       const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
       };

       // Capture instances of NewBill for configuring callbacks during testing
        const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    })


  });

})



  





/*

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be active", () => {
      const iconMail = screen.getByTestId('icon-mail')
      
      // expected values
      expect(iconMail.className).toBe('active-icon')
    })

    test("Then there are a form to edit new bill", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const title = screen.getAllByText("Envoyer une note de frais")
      
      // expected values
      expect(title).toBeTruthy
    })
  })
    
  


    
    // POST
    test("Then it should create a new bill", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: localStorageMock,
      });
      
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);
      
      fireEvent.submit(submitBtn);
      
      // expected values
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  
  describe("When I fill in the fields in the right format and I click on submit button", () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      router()
    })

    test("Then I have an error server (500)", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update : jest.fn().mockRejectedValueOnce(false)
        }
      })
    
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      
      try {
        fireEvent.submit(form);
      } catch(err) {
        // expected values
        expect(err).toMatch('error');
      }
    })
  })
  
  describe("When an error occurs on API", () => {
    test("POST New Bill and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
        
      window.onNavigate(ROUTES_PATH.Bills)
      
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      
      // expected values
      expect(message).toBeTruthy()
    })

    test("POST New Bill and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      
      // expected values
      expect(message).toBeTruthy()
    })
  })
});

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  jest.spyOn(mockStore, "bills");
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
  
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  
  document.body.appendChild(root);
  
  router();
  
  window.onNavigate(ROUTES_PATH.NewBill);
});

*/