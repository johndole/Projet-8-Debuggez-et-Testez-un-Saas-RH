/**
 * @jest-environment jsdom
 */
import { expect, jest, test } from "@jest/globals";
import { screen, waitFor, fireEvent, userEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";


  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee'
  }))

  const root = document.createElement("div")
  root.setAttribute("id", "root") 
  document.body.append(root)

  router() 
  window.onNavigate(ROUTES_PATH.Bills)

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  }


describe("Given I am connected as an employee", () => {

  describe("When I am on Bills Page", () => {

    afterEach( () => {
      jest.clearAllMocks()
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
 
      window.onNavigate(ROUTES_PATH.Bills)
      
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //TODO
      // Vérifie si l'élément a la classe 'active-icon'
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
      .map(a => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then bills should be fetched successfully from mock API GET", async () => {

      const store = mockStore
      const getSpyOn = jest.spyOn(store, "bills")

      const bills = await store.bills().list()

      expect(screen.getByText("accepted")).toBeTruthy()
      expect(getSpyOn).toHaveBeenCalledTimes(1)
      expect(bills.length).toBe(4)
    })

    test('Then, Loading page should be rendered', () => {
      document.body.innerHTML = BillsUI({ loading: true });
  
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    })

    test("Then, The page got a title 'Mes notes de frais' and there is a button 'Nouvelle Note de frais'", () => {
      document.body.innerHTML = BillsUI({ data: [] })

      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })
    
  });

  describe("When i am on Bills Page and an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      
    })
    afterEach( () => {
      jest.clearAllMocks()
    })
    test("Then fetches bills failed and we might have a 404 message error", async () => {

      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)

      expect(message).toBeTruthy()
    })

    test("Then fetches bills failed and we might have a 500 message error", async () => {
    
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)

      expect(message).toBeTruthy();
    })
  });

  describe("When I am on Bills Page and i click on new bill button", () => {
    afterEach( () => {
      jest.clearAllMocks()
    })
    test("Then, should handle click and redirect to new bill page ", async () => {
      
      // Arrange

      // Mocking the route to NewBill
      jest.spyOn(window, 'location', 'get').mockImplementation(() => ({
        pathname: ROUTES_PATH["NewBill"],
      }));

      document.body.innerHTML = BillsUI({ data: bills });

      const billInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Act
      const handleClickNewBillMock = jest.fn((e) =>
        billInstance.handleClickNewBill(e)
      );
      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const buttonNewBill = screen.getByTestId("btn-new-bill");
  
      buttonNewBill.addEventListener("click", handleClickNewBillMock);
      fireEvent.click(buttonNewBill);

      // Assert
      expect(handleClickNewBillMock).toHaveBeenCalled();
      expect(window.location.pathname).toBe(ROUTES_PATH["NewBill"]);
    });
  });

  describe("When I am on Bills Page and i click on eye icon", () => {
    afterEach( () => {
      jest.clearAllMocks()
    })
    test("Then, should handle click and open modal", async () => {
      
      // Arrange
      document.body.innerHTML = BillsUI({ data: bills })

      const billInstance = new Bills({
        document,
        onNavigate,
        store : null,
        localStorage: window.localStorage,
      })

      // Act
      const modale = document.getElementById("modaleFile")
      $.fn.modal = jest.fn(() => modale.classList.add("show"))

      const eye = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(() => billInstance.handleClickIconEye(eye))

      eye.addEventListener("click", handleClickIconEye)
      fireEvent.click(eye)

      // Assert
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(modale.classList.contains("show")).toBe(true);
      expect(bills[0].fileUrl).toBeTruthy()
      expect(screen.getByText("Justificatif")).toBeTruthy()  
      })
  });

});

describe('When i am on Bills Page, and I call getBills', () => {
  afterEach( () => {
    jest.clearAllMocks()
  })
  test('Then, it should log the length of bills array and return bills', async () => {
    // Mock des données de facture avec le nouveau format de date
     // Mocking snapshot of bills from the store
     const snapshot = bills;

    // Mocking bills with formatted dates and statuses
    const formattedBills = snapshot.map(doc => ({
      ...doc,
      date: formatDate(doc.date),
      status: formatStatus(doc.status)
    }));

    // Mocking store bills method
    mockStore.bills().list = jest.fn().mockResolvedValue(snapshot);


    // Initialiser le HTML de la page Bills
    document.body.innerHTML = BillsUI({ data: bills });

    // Initialiser une instance de Bills
    const billInstance = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    // Espionner console.log
    const consoleLogSpy = jest.spyOn(console, 'log');

    // Appeler la méthode getBills
    const result = await billInstance.getBills();

    // S'attendre à ce que console.log ait été appelé avec les bons arguments
    expect(consoleLogSpy).toHaveBeenCalledWith('length', bills.length);
    // S'attendre à ce que les factures retournées soient identiques aux factures avec les dates formatées
    expect(result).toEqual(formattedBills);
    expect(result).toHaveLength(bills.length);
  });

});



