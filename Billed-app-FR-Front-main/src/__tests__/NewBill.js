/**
 * @jest-environment jsdom
 */
import {expect, jest, test} from '@jest/globals';
import { screen, fireEvent} from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH} from "../constants/routes";

import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";


// Mock document and form elements
document.body.innerHTML = NewBillUI();

// Path to route files (Router.js),(routes.js)
const onNavigateMock = (pathname) => {
document.body.innerHTML = ROUTES({ pathname });
};



describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page and I select a file with a valid extension (jpg, jpeg, png)', () => {
     test('It should handle file change event', async () => {
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
    
      // Capture instances of NewBill for configuring callbacks during testing
      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
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
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    })
    test('It should display an error message alert', async () => {
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
    
      // Capture instances of NewBill for configuring callbacks during testing
        new NewBill({
          document,
          onNavigate: onNavigateMock,
          store: mockStore,
          localStorage: window.localStorage,
      });

       // Act: Trigger the change event
        fireEvent.change(screen.getByTestId('file'));
      
      // Assert: Check if the file input is correctly handled
        expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner un fichier avec une extension .jpg, .png ou .jpeg.');
        expect(screen.getByTestId('file').value).toEqual('');
    });
  });

  describe('When I am on NewBill Page and I submit the form', () => {
   beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    jest.clearAllMocks();

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

    test('It should handle a valid form submission', () => {
      // Set up any necessary initial state or component instances
      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Mock the event object
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation(selector => {
            switch (selector) {
              case 'input[data-testid="datepicker"]':
                return { value: '2024-03-11' };
              case 'select[data-testid="expense-type"]':
                return { value: 'Hôtel et logement' };
              case 'input[data-testid="expense-name"]':
                return { value: 'encore' };
              case 'input[data-testid="amount"]':
                return { value: '400' };
              case 'input[data-testid="vat"]':
                return { value: '80' };
              case 'input[data-testid="pct"]':
                return { value: '20' };
              case 'textarea[data-testid="commentary"]':
                return { value: 'séminaire billed' };
              // Add other cases as needed
              default:
                return {};
            }
          }),
        },
      };

      // Call the handleSubmit function with the mock event
      newBill.handleSubmit(mockEvent);

      // Mock successful create response
      mockStore.bills().create = jest.fn().mockResolvedValue({ fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234' });
     
      // Perform assertions
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(JSON.parse(localStorageMock.getItem('user'))).toEqual("{\"type\":\"Employee\",\"email\":\"user@example.com\"}");
    });
    

    test('It should create a new bill and redirect to Bills Page', async () => {
    
       // Capture instances of NewBill for configuring callbacks during testing
        const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: window.localStorage,
      });

        // Mock successful create response
        mockStore.bills().create = jest.fn().mockResolvedValue({ fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234' });
      
        // Mock file input change event
        const fileInput = document.querySelector(`input[data-testid="file"]`);
        fireEvent.change(fileInput, { target: { files: [new File(['images'], 'test.jpg', { type: "jpg" })] } });

        // Wait for asynchronous tasks to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
        const form = screen.getByTestId('form-new-bill');
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener('submit', handleSubmit);
        fireEvent.submit(form);

        // Assertions
        expect(handleSubmit).toHaveBeenCalled();
        expect(mockStore.bills().create).toHaveBeenCalled();
        expect(newBill.billId).toBe('1234');
        expect(newBill.fileUrl).toBe('https://localhost:3456/images/test.jpg');
        expect(fileInput.files[0].name).toBe('test.jpg');
        onNavigateMock(ROUTES_PATH.Bills);
    })

  });



});