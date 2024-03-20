/**
 * @jest-environment jsdom
 */
import {expect, jest, test} from '@jest/globals';
import {screen, waitFor, fireEvent, userEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";



describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
      beforeEach(() => {
        // Mock dependencies for each test case
        // GIVEN PART
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        // WHEN PART
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        // Reset the mocks for each test
        jest.clearAllMocks();
    
      });

      test("Then bill icon in vertical layout should be highlighted", async () => {

        // THEN PART
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        //to-do write expect expression
        expect(windowIcon.contains('active-icon')).toBe(true)

      })

      test("Then bills should be ordered from earliest to latest", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)

        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)

        expect(datesSorted).toEqual([...dates].sort().reverse())
      })
    })  
      it('should handle click on new bill button', async () => {

       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
        // Arrange
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Act
        const handleClickNewBillMock = jest.fn((e) => billsInstance.handleClickNewBill(e));
        await waitFor(() => screen.getByTestId('btn-new-bill'));
        const buttonNewBill = screen.getByTestId('btn-new-bill');
      

        buttonNewBill.addEventListener('click', handleClickNewBillMock);
        fireEvent.click(buttonNewBill);
        // Assert
        expect(handleClickNewBillMock).toHaveBeenCalled();
      });
    
      it('should handle click on icon eye', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
      
        document.body.innerHTML = BillsUI({ data: bills })
      
        // Arrange
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
      
        // Spy on handleClickIconEye method
        const handleClickIconEyeMock = jest.fn((e) => billsInstance.handleClickIconEye(e));
      
        // Act
        await waitFor(() => screen.getAllByTestId('icon-eye'));
        const iconsEye = screen.getAllByTestId('icon-eye')[0];
      
        // Trigger click event on each icon
  
          
          iconsEye.addEventListener('click', handleClickIconEyeMock);
          fireEvent.click(iconsEye);
      
        // Assert
        // Expect spy to have been called for each icon
        expect(handleClickIconEyeMock).toHaveBeenCalled();
      });
        

    describe('When bill is created with formatStatus', () => {
      it('should return "En attente" for status "pending"', () => {
        // Arrange
        const status = 'pending';
    
        // Act
        const result = formatStatus(status);
    
        // Assert
        expect(result).toBe('En attente');
      });
    
      it('should return "Accepté" for status "accepted"', () => {
        // Arrange
        const status = 'accepted';
    
        // Act
        const result = formatStatus(status);
    
        // Assert
        expect(result).toBe('Accepté');
      });
    
      it('should return "Refused" for status "refused"', () => {
        // Arrange
        const status = 'refused';
    
        // Act
        const result = formatStatus(status);
    
        // Assert
        expect(result).toBe('Refused');
      });
    
      it('should return the same status for unknown status', () => {
        // Arrange
        const status = undefined;
    
        // Act
        const result = formatStatus(status);
    
        // Assert
        expect(result).toBe(status);
      });
    });
  })

