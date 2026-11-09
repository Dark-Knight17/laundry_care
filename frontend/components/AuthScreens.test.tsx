import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { SignIn } from "./SignIn.tsx";
import { SignUp } from "./SignUp.tsx";

describe("SignIn screen component", () => {
  test("renders heading, fields, submit button and link to sign-up", () => {
    const html = renderToString(<SignIn onNavigateToSignUp={() => {}} />);
    expect(html).toContain("Welcome back");
    expect(html).not.toContain("Enter your email and password to access the scanner.");
    expect(html).toContain('id="signin-email"');
    expect(html).toContain('id="signin-password"');
    expect(html).toContain("Sign in");
    expect(html).toContain("Don&#x27;t have an account?");
    expect(html).toContain("Sign up");
  });
});

describe("SignUp screen component", () => {
  test("renders heading, fields in correct order, hint, submit button and link to sign-in", () => {
    const html = renderToString(<SignUp onNavigateToSignIn={() => {}} />);
    expect(html).toContain("Create your account");
    expect(html).not.toContain("It only takes a minute.");
    expect(html).toContain('id="signup-first-name"');
    expect(html).toContain('id="signup-last-name"');
    expect(html).toContain('id="signup-email"');
    expect(html).toContain('id="signup-password"');
    expect(html).toContain("At least 8 characters");
    expect(html).toContain("Create account");
    expect(html).toContain("Already have an account?");
    expect(html).toContain("Sign in");

    // Check order of fields
    const firstNamePos = html.indexOf('id="signup-first-name"');
    const lastNamePos = html.indexOf('id="signup-last-name"');
    const emailPos = html.indexOf('id="signup-email"');
    const passwordPos = html.indexOf('id="signup-password"');

    expect(firstNamePos).toBeLessThan(lastNamePos);
    expect(lastNamePos).toBeLessThan(emailPos);
    expect(emailPos).toBeLessThan(passwordPos);
  });
});
