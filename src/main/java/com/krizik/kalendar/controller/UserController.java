package com.krizik.kalendar.controller;

import com.krizik.kalendar.entity.User;
import com.krizik.kalendar.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        System.out.println("--- REGISTRACE START ---");
        System.out.println("Jméno: " + user.getUsername());
        System.out.println("Heslo: " + user.getPassword());

        try {
            boolean isCreated = userService.registerUser(user);
            if (isCreated) {
                System.out.println("Registrace OK");
                return ResponseEntity.ok("Uživatel vytvořen");
            } else {
                System.out.println("Uživatel už existuje (podle Service)");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Uživatel již existuje");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Chyba serveru: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest, HttpServletRequest request) {
        System.out.println("--- LOGIN START ---");
        System.out.println("Login request pro: " + loginRequest.getUsername());

        User user = userService.AuthenticateUser(loginRequest.getUsername(), loginRequest.getPassword());

        if (user != null) {
            HttpSession session = request.getSession(true);
            session.setAttribute("LOGGED_USER", user);
            System.out.println("Login ÚSPĚŠNÝ, Session ID: " + session.getId());
            return ResponseEntity.ok(user);
        } else {
            System.out.println("Login SELHAL (špatné heslo nebo neexistuje)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Špatné údaje");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok("Odhlaseno");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if(session != null) {
            User user = (User) session.getAttribute("LOGGED_USER");
            if (user != null) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Nikdo neni prihlasen");
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
}