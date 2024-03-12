/**
 * @jest-environment jsdom
 */
import {expect, jest, test} from '@jest/globals';
import {screen, waitFor, fireEvent, userEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";



describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
      test("Then bill icon in vertical layout should be highlighted", async () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        //to-do write expect expression
        expect(windowIcon.classList.contains('active-icon')).toBe(true)

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
    describe('Bills class', () => {

      beforeEach(() => {
        // Mock dependencies for each test case
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        // Reset the mocks for each test
        jest.clearAllMocks();
    
      });
    
      it('should handle click on new bill button', () => {
        // Arrange
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
    
        // Act
        const buttonNewBill = screen.getByTestId('btn-new-bill');
        const handleClickNewBillMock = jest.spyOn(billsInstance, 'handleClickNewBill');
        buttonNewBill.addEventListener('click', handleClickNewBillMock);
        fireEvent.click(buttonNewBill);
        // Assert
        expect(handleClickNewBillMock).toHaveBeenCalled();
      });
    
      it('should handle click on icon eye', () => {
        // Arrange
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
    
    
            // Act
         const iconsEye = screen.getAllByTestId('icon-eye');

        // Create a spy on the handleClickIconEye method
        const handleClickIconEyeSpy = jest.fn((e) => billsInstance.handleClickIconEye(e));

        iconsEye.forEach((icon) => {
          icon.addEventListener('click', (e) => {
                // Ensure that 'icon' is an HTML element
                if (e.currentTarget instanceof HTMLElement) {
                  handleClickIconEyeSpy(e.currentTarget);
                }
              });

        fireEvent.click(icon);
      });

      // Assert
      // You can add more specific assertions based on your requirements
      expect(handleClickIconEyeSpy).toHaveBeenCalledTimes(iconsEye.length);
      });
    
      it('should get bills from the store and format them', async () => {


        // Mock the functions used within the class
        formatDate = jest.fn().mockImplementation((date) => `formatted-${date}`);
        formatStatus = jest.fn().mockImplementation((status) => `formatted-${status}`);
        
        // Arrange
        const mockSnapshot = [
          { date: '2022-01-01', status: 'pending' },
          { date: '2022-02-02', status: 'paid' },
        ];
    
        mockStore.bills().list = jest.fn().mockResolvedValueOnce(mockSnapshot);
    
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
    
        // Act
        const result = await billsInstance.getBills();
    
        // Assert
        expect(result).toEqual([
          { date: 'formatted-2022-01-01', status: 'formatted-pending' },
          { date: 'formatted-2022-02-02', status: 'formatted-paid' },
        ]);
        expect(formatDate).toHaveBeenCalledTimes(2);
        expect(formatStatus).toHaveBeenCalledTimes(2);
      });
    });

  })

