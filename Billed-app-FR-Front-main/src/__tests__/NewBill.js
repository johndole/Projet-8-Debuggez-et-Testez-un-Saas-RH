/**
 * @jest-environment jsdom
 */
import { expect, jest, test } from "@jest/globals";
import { screen, fireEvent} from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";

import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";

// Mock document and form elements
document.body.innerHTML = NewBillUI();

// Path to route files (Router.js),(routes.js)
const onNavigateMock = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I select a file with a valid extension (jpg, jpeg, png)", () => {
    test("It should handle file change event", async () => {
      // Arrange: Set up common conditions for the test with a valid file
      document.body.innerHTML = NewBillUI();
      const fileInput = screen.getByTestId("file");

      // Mock a file with the specified name and type
      const file = new File(["(content)"], "test.jpg", { type: "jpg" });
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });

      // Mock localStorage for the file upload
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Capture instances of NewBill for configuring callbacks during testing
      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Act: Trigger the change event
      const handleChangeFile = jest.fn((e) =>
        newBill.handleChangeFile(e, fileInput.files[0].name)
      );
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput);

      // Assert: Check if the file input is correctly handled
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files[0].name).toEqual("test.jpg");
    });
  });

  describe("When I am on NewBill Page and I select a file with an invalid extension", () => {
    beforeEach(() => {
      // Mock console.error and alert
      jest.spyOn(window, "alert").mockImplementation(() => {});
    });
    test("It should display an error message alert", async () => {
      // Arrange: Set up common conditions for the test with a valid file
      document.body.innerHTML = NewBillUI();
      const fileInput = screen.getByTestId("file");

      // Mock a file with the specified name and type
      const file = new File(["(content)"], "test.txt", { type: "text/plain" });
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });

      // Mock localStorage for the file upload
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Capture instances of NewBill for configuring callbacks during testing
      new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Act: Trigger the change event
      fireEvent.change(screen.getByTestId("file"));

      // Assert: Check if the file input is correctly handled
      expect(window.alert).toHaveBeenCalledWith(
        "Veuillez sélectionner un fichier avec une extension .jpg, .png ou .jpeg."
      );
      expect(screen.getByTestId("file").value).toEqual("");
    });
  });

    //POST TEST
  describe("When I am on NewBill Page and I submit the form", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");

      // Mock localStorage for the file upload
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "user@example.com",
        })
      );

      document.body.innerHTML = NewBillUI();
    });

    test('renders form fields correctly', async () => {

     // Configuration de localStorageMock pour simuler le stockage local
			const postSpy = jest.spyOn(mockStore, "bills")
			
			// Creation d'une facture 
			const bill = {
				id: "47qAXb6fIm2zOKkLzMro",
				vat: "80",
				fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
				status: "pending",
				type: "Hôtel et logement",
				commentary: "séminaire billed",
				name: "encore",
				fileName: "preview-facture-free-201801-pdf-1.jpg",
				date: "2004-04-04",
				amount: 400,
				commentAdmin: "ok",
				email: "a@a",
				pct: 20,
			}
			// Ajout de la facture dans le store
			const NewPostBills = await mockStore.bills().update(bill)

			// Vérifier si la méthode postSpy a été appelée
			expect(postSpy).toHaveBeenCalledTimes(1)

			// Vérifier si la facture correspond à celle presente dans le store mocké
			expect(NewPostBills).toStrictEqual(bill)
    });

    test("It should create a new bill and redirect to Bills Page", async () => {
      // Capture instances of NewBill for configuring callbacks during testing
      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Mock successful create response
      mockStore.bills().create = jest
        .fn()
        .mockResolvedValue({
          fileUrl: "https://localhost:3456/images/test.jpg",
          key: "1234",
        });

      // Mock file input change event
      const fileInput = document.querySelector(`input[data-testid="file"]`);
      fireEvent.change(fileInput, {
        target: { files: [new File(["images"], "test.jpg", { type: "jpg" })] },
      });

      // Wait for asynchronous tasks to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      // Assertions
      expect(handleSubmit).toHaveBeenCalled();
      expect(mockStore.bills().create).toHaveBeenCalled();
      expect(newBill.billId).toBe("1234");
      expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg");
      expect(fileInput.files[0].name).toBe("test.jpg");
    });
  });
  
  describe("When an error occurs on API", () => {
		beforeEach(() => {
			jest.spyOn(mockStore, "bills");

			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});

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
		});

		test("fetches bill from an API and fails with 404 error message", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					create: () => {
						return Promise.reject(new Error("Erreur 404"));
					},
				};
			});

			window.onNavigate(ROUTES_PATH.NewBill);

			await new Promise(process.nextTick);

			document.body.innerHTML = BillsUI({ error: "Erreur 404" });

			const errorMessageElement = screen.getByTestId("error-message");
			const errorEessage = screen.getByText(/Erreur 404/);

			expect(errorMessageElement).toBeTruthy();
			expect(errorEessage).toBeTruthy();
		});

		test(" fetches messages from an API and fails with 500 message error", async () => {
			mockStore.bills.mockImplementationOnce(() => {
				return {
					create: () => {
						return Promise.reject(new Error("Erreur 500"));
					},
				};
			});

			window.onNavigate(ROUTES_PATH.NewBill);

			await new Promise(process.nextTick);

			document.body.innerHTML = BillsUI({ error: "Erreur 500" });

			const errorMessageElement = screen.getByTestId("error-message");
			const errorEessage = screen.getByText(/Erreur 500/);

			expect(errorMessageElement).toBeTruthy();
			expect(errorEessage).toBeTruthy();
		});
	});

});
