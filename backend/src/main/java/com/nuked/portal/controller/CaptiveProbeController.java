package com.nuked.portal.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Connectivity-check endpoints that iOS / Android / Windows hit silently when
 * a device joins a Wi-Fi network to decide whether the network "has internet."
 * On the mac-attendance branch the Mac becomes the small web server on a
 * private Wi-Fi (campus router or borrowed home router). If these endpoints
 * weren't reachable, phones would tag the Wi-Fi as no-internet and try to
 * route the attendance request through cellular instead — which can't reach
 * the Mac's private IP.
 *
 * Each platform expects a specific HTTP shape:
 *   iOS / macOS:  GET /hotspot-detect.html  → body must contain "Success"
 *   iOS / macOS:  GET /library/test/success.html  → same
 *   Android:      GET /generate_204 or /gen_204  → HTTP 204 No Content
 *   Windows:      GET /ncsi.txt  → body "Microsoft NCSI"
 *   Windows 10+:  GET /connecttest.txt  → body "Microsoft Connect Test"
 *   Misc:         GET /success.txt  → body "success"
 */
@RestController
public class CaptiveProbeController {

    @GetMapping(value = {"/hotspot-detect.html", "/library/test/success.html"},
            produces = MediaType.TEXT_HTML_VALUE)
    public String appleSuccess() {
        return "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>";
    }

    @GetMapping({"/generate_204", "/gen_204"})
    public ResponseEntity<Void> androidNoContent() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/ncsi.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String windowsNcsi() {
        return "Microsoft NCSI";
    }

    @GetMapping(value = "/connecttest.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String windows10ConnectTest() {
        return "Microsoft Connect Test";
    }

    @GetMapping(value = "/success.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String genericSuccess() {
        return "success";
    }
}
