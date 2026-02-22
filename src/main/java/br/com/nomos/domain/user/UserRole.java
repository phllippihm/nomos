package br.com.nomos.domain.user;

public enum UserRole {
    ADMIN("ADMIN"),
    CONTROLLER("CONTROLLER"),
    USER("USER");

    private String role;

    UserRole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}
