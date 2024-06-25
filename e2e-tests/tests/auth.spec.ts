import { test, expect } from '@playwright/test';

const UI_URL = "http://localhost:5173/"

test('should allow the user to sign in', async ({ page }) => {
  await page.goto(UI_URL)

  // get the signin button
  // we get the role of the element which is in our case a link then 
  // we write what the element says on the screen in our case it says 
  // Sign In that we then click on it 
  await page.getByRole("link", {name: "Sign In"}).click()

  // to make sure that we are redirected we can check if the 
  // page itself has the the heading called Sign In cuz we used h2 for the Sign In
  await expect(page.getByRole("heading", {name: "Sign In"})).toBeVisible()

  // here we are filling the fields of email and password 
  await page.locator("[name=email]").fill("1@1.com")
  await page.locator("[name=password]").fill("password")
  
  // here we are clicking on the button so it can redirect us to the home page
  await page.getByRole("button", {name: "Login"}).click()

  // here we are on the home page and logged in, we can check if thats the
  // case by checking for certain links 
  await expect(page.getByText("Sign In Successful!")).toBeVisible()
  await expect(page.getByRole("link", {name: "My Bookings"})).toBeVisible()
  await expect(page.getByRole("link", {name: "My Hotels"})).toBeVisible()
  await expect(page.getByRole("button", {name: "Sign Out"})).toBeVisible()

});

test("should allow user to register", async ({ page }) => {
  const testEmail = `test_register_${
    Math.floor(Math.random() * 90000) + 10000}@test.com`;

  await page.goto(UI_URL);

  await page.getByRole("link", { name: "Sign In" }).click();
  await page.getByRole("link", { name: "Create an account here" }).click();
  await expect(
    page.getByRole("heading", { name: "Create an Account" })
  ).toBeVisible();

  await page.locator("[name=firstName]").fill("test_firstName");
  await page.locator("[name=lastName]").fill("test_lastName");
  await page.locator("[name=email]").fill(testEmail);
  await page.locator("[name=password]").fill("password123");
  await page.locator("[name=confirmPassword]").fill("password123");

  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Registration Success!")).toBeVisible();
  await expect(page.getByRole("link", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Hotels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
});


// playwright is a way to test the data that we have, where we basically
// navigate to a page and then do stuff 

// when checking 
// frontend:npm run dev
// backend: npm run e2e


// npm init playwright@latest to use playwright in ts 