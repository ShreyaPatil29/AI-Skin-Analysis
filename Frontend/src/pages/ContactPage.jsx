import React from 'react';

function ContactPage() {
  return (
    <section id="contact" className="contact-section section-padding bg-light">
      <div className="container">
        <h2 className="animate-fade-in-up">Contact & Support</h2>
        <p className="section-description animate-fade-in-up animate-delay-200">
          Get in touch with our team for support or collaboration opportunities
        </p>
        <div className="contact-grid">
          <div className="contact-info animate-fade-in-up animate-delay-300">
            <h3>Email Support</h3>
            <p>For technical support and inquiries</p>
            <a href="mailto:contact@skinai.com">contact@skinai.com</a>
          </div>
          <div className="contact-info animate-fade-in-up animate-delay-400">
            <h3>Professional Network</h3>
            <p>Connect with us professionally</p>
            <a href="#" className="btn btn-secondary">LinkedIn Profile</a>
          </div>
          <div className="contact-info animate-fade-in-up animate-delay-500">
            <h3>Open Source</h3>
            <p>Contribute to our research</p>
            <a href="#" className="btn btn-secondary">GitHub Repository</a>
          </div>
        </div>
        <div className="contact-form animate-scale-in animate-delay-600">
          <h3>Send us a message</h3>
          <form>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Your Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" id="subject" name="subject" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Your Message</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            <button type="submit" className="btn btn-primary">
              <span className="btn-icon">📤</span>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;


