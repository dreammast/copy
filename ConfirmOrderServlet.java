import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.*;
import java.io.IOException;

@WebServlet("/confirmOrder")
public class ConfirmOrderServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        // Secure form input retrieval
        String name = request.getParameter("name");
        String phone = request.getParameter("phone");
        String email = request.getParameter("email");
        String paymentMode = request.getParameter("paymentMode");

        // Basic validation
        if (name == null || phone == null || email == null || paymentMode == null ||
            name.trim().isEmpty() || phone.trim().isEmpty() || email.trim().isEmpty() || paymentMode.trim().isEmpty()) {
            request.setAttribute("errorMessage", "All fields are required.");
            // Forward back to the confirmation page with error
            RequestDispatcher dispatcher = request.getRequestDispatcher("/confirm.jsp");
            dispatcher.forward(request, response);
            return;
        }

        // (Optional) Payment handling logic would go here

        // Store details in session or forward for further processing
        HttpSession session = request.getSession();
        session.setAttribute("customerName", name);
        session.setAttribute("paymentMode", paymentMode);

        // Redirect to thank you / confirmation page
        response.sendRedirect("thankyou.jsp");
    }
}