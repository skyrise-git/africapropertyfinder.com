import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { marketingSite } from "@/lib/config";

export default function TermsPage() {
  const lastUpdated = new Date("November 15, 2025").toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Terms and Conditions
        </h1>
        <p className="text-muted-foreground text-lg">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Agreement to Terms</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These Terms and Conditions constitute a legally binding agreement
              made between you, whether personally or on behalf of an entity
              (&quot;you&quot;), and {marketingSite.name} (&quot;Company&quot;,
              &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), concerning
              your access to and use of the{" "}
              <Link
                href={marketingSite.url}
                target="_blank"
                rel="external nofollow noopener"
                className="text-primary underline hover:no-underline"
              >
                {marketingSite.url}
              </Link>{" "}
              website as well as any other media form, media channel, mobile
              website or mobile application related, linked, or otherwise
              connected thereto (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-muted-foreground">
              You agree that by accessing the Service, you have read, understood,
              and agree to be bound by all of these Terms and Conditions. If you
              do not agree with all of these Terms and Conditions, then you are
              expressly prohibited from using the Service and you must
              discontinue use immediately.
            </p>
            <p className="text-muted-foreground">
              Supplemental terms and conditions or documents that may be posted on
              the Service from time to time are hereby expressly incorporated
              herein by reference. We reserve the right, in our sole discretion,
              to make changes or modifications to these Terms and Conditions at
              any time and for any reason.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              Intellectual Property Rights
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unless otherwise indicated, the Service is our proprietary property
              and all source code, databases, functionality, software, website
              designs, audio, video, text, photographs, and graphics on the
              Service (collectively, the &quot;Content&quot;) and the trademarks,
              service marks, and logos contained therein (the
              &quot;Marks&quot;) are owned or controlled by us or licensed to us,
              and are protected by copyright and trademark laws and various other
              intellectual property rights and unfair competition laws of the
              United States, international copyright laws, and international
              conventions.
            </p>
            <p className="text-muted-foreground">
              The Content and the Marks are provided on the Service
              &quot;AS IS&quot; for your information and personal use only.
              Except as expressly provided in these Terms and Conditions, no part
              of the Service and no Content or Marks may be copied, reproduced,
              aggregated, republished, uploaded, posted, publicly displayed,
              encoded, translated, transmitted, distributed, sold, licensed, or
              otherwise exploited for any commercial purpose whatsoever, without
              our express prior written permission.
            </p>
            <p className="text-muted-foreground">
              Provided that you are eligible to use the Service, you are granted
              a limited license to access and use the Service and to download or
              print a copy of any portion of the Content to which you have
              properly gained access solely for your personal, non-commercial
              use. We reserve all rights not expressly granted to you in and to
              the Service, the Content and the Marks.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">User Representations</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              By using the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                All registration information you submit will be true, accurate,
                current, and complete.
              </li>
              <li>
                You will maintain the accuracy of such information and promptly
                update such registration information as necessary.
              </li>
              <li>
                You have the legal capacity and you agree to comply with these
                Terms and Conditions.
              </li>
              <li>
                You are not a minor in the jurisdiction in which you reside, or
                if a minor, you have received parental permission to use the
                Service.
              </li>
              <li>
                You will not access the Service through automated or non-human
                means, whether through a bot, script, or otherwise.
              </li>
              <li>
                You will not use the Service for any illegal or unauthorized
                purpose.
              </li>
              <li>
                Your use of the Service will not violate any applicable law or
                regulation.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Prohibited Activities</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You may not access or use the Service for any purpose other than
              that for which we make the Service available. The Service may not be
              used in connection with any commercial endeavors except those that
              are specifically endorsed or approved by us.
            </p>
            <p className="text-muted-foreground">
              As a user of the Service, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Systematically retrieve data or other content from the Service to
                create or compile, directly or indirectly, a collection,
                compilation, database, or directory without written permission from
                us.
              </li>
              <li>
                Trick, defraud, or mislead us and other users, especially in any
                attempt to learn sensitive account information such as user
                passwords.
              </li>
              <li>
                Circumvent, disable, or otherwise interfere with security-related
                features of the Service, including features that prevent or
                restrict the use or copying of any Content or enforce limitations
                on the use of the Service and/or the Content contained therein.
              </li>
              <li>
                Disparage, tarnish, or otherwise harm, in our opinion, us and/or
                the Service.
              </li>
              <li>
                Use any information obtained from the Service in order to harass,
                abuse, or harm another person.
              </li>
              <li>
                Make improper use of our support services or submit false reports
                of abuse or misconduct.
              </li>
              <li>
                Use the Service in a manner inconsistent with any applicable laws
                or regulations.
              </li>
              <li>
                Engage in unauthorized framing of or linking to the Service.
              </li>
              <li>
                Upload or transmit (or attempt to upload or to transmit) viruses,
                Trojan horses, or other material, including excessive use of
                capital letters and spamming (continuous posting of repetitive
                text), that interferes with any party's uninterrupted use and
                enjoyment of the Service or modifies, impairs, disrupts, alters,
                or interferes with the use, features, functions, operation, or
                maintenance of the Service.
              </li>
              <li>
                Engage in any automated use of the system, such as using scripts
                to send comments or messages, or using any data mining, robots, or
                similar data gathering and extraction tools.
              </li>
              <li>
                Delete the copyright or other proprietary rights notice from any
                Content.
              </li>
              <li>
                Attempt to impersonate another user or person or use the username
                of another user.
              </li>
              <li>
                Sell or otherwise transfer your profile.
              </li>
              <li>
                Upload or transmit (or attempt to upload or to transmit) any
                material that acts as a passive or active information collection or
                transmission mechanism, including without limitation, clear
                graphics interchange formats (&quot;gifs&quot;), 1×1 pixels, web
                bugs, cookies, or other similar devices (sometimes referred to as
                &quot;spyware&quot; or &quot;passive collection mechanisms&quot;
                or &quot;pcms&quot;).
              </li>
              <li>
                Interfere with, disrupt, or create an undue burden on the Service
                or the networks or services connected to the Service.
              </li>
              <li>
                Harass, annoy, intimidate, or threaten any of our employees or
                agents engaged in providing any portion of the Service to you.
              </li>
              <li>
                Attempt to bypass any measures of the Service designed to prevent
                or restrict access to the Service, or any portion of the Service.
              </li>
              <li>
                Copy or adapt the Service's software, including but not limited to
                Flash, PHP, HTML, JavaScript, or other code.
              </li>
              <li>
                Except as permitted by applicable law, decipher, decompile,
                disassemble, or reverse engineer any of the software comprising or
                in any way making up a part of the Service.
              </li>
              <li>
                Except as may be the result of standard search engine or Internet
                browser usage, use, launch, develop, or distribute any automated
                system, including without limitation, any spider, robot, cheat
                utility, scraper, or offline reader that accesses the Service, or
                use or launch any unauthorized script or other software.
              </li>
              <li>
                Use a buying agent or purchasing agent to make purchases on the
                Service.
              </li>
              <li>
                Make any unauthorized use of the Service, including collecting
                usernames and/or email addresses of users by electronic or other
                means for the purpose of sending unsolicited email, or creating
                user accounts by automated means or under false pretenses.
              </li>
              <li>
                Use the Service as part of any effort to compete with us or
                otherwise use the Service and/or the Content for any
                revenue-generating endeavor or commercial enterprise.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">User Generated Contributions</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The Service may invite you to chat, contribute to, or participate in
              blogs, message boards, online forums, and other functionality, and
              may provide you with the opportunity to create, submit, post,
              display, transmit, perform, publish, distribute, or broadcast
              content and materials to us or on the Service, including but not
              limited to text, writings, video, audio, photographs, graphics,
              comments, suggestions, or personal information or other material
              (collectively, &quot;Contributions&quot;).
            </p>
            <p className="text-muted-foreground">
              Contributions may be viewable by other users of the Service and
              through third-party websites. As such, any Contributions you
              transmit may be treated as non-confidential and non-proprietary.
              When you create or make available any Contributions, you thereby
              represent and warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The creation, distribution, transmission, public display, or
                performance, and the accessing, downloading, or copying of your
                Contributions do not and will not infringe the proprietary rights,
                including but not limited to the copyright, patent, trademark,
                trade secret, or moral rights of any third party.
              </li>
              <li>
                You are the creator and owner of or have the necessary licenses,
                rights, consents, releases, and permissions to use and to
                authorize us, the Service, and other users of the Service to use
                your Contributions in any manner contemplated by the Service and
                these Terms and Conditions.
              </li>
              <li>
                You have the written consent, release, and/or permission of each
                and every identifiable individual person in your Contributions to
                use the name or likeness of each and every such identifiable
                individual person to enable inclusion and use of your
                Contributions in any manner contemplated by the Service and these
                Terms and Conditions.
              </li>
              <li>
                Your Contributions are not false, inaccurate, or misleading.
              </li>
              <li>
                Your Contributions are not unsolicited or unauthorized advertising,
                promotional materials, pyramid schemes, chain letters, spam, mass
                mailings, or other forms of solicitation.
              </li>
              <li>
                Your Contributions are not obscene, lewd, lascivious, filthy,
                violent, harassing, libelous, slanderous, or otherwise
                objectionable (as determined by us).
              </li>
              <li>
                Your Contributions do not ridicule, mock, disparage, intimidate,
                or abuse anyone.
              </li>
              <li>
                Your Contributions are not used to harass or threaten (in the
                legal sense of those terms) any other person and to promote
                violence against a specific person or class of people.
              </li>
              <li>
                Your Contributions do not violate any applicable law, regulation,
                or rule.
              </li>
              <li>
                Your Contributions do not violate the privacy or publicity rights
                of any third party.
              </li>
              <li>
                Your Contributions do not violate any applicable law concerning
                child pornography, or otherwise intended to protect the health or
                well-being of minors.
              </li>
              <li>
                Your Contributions do not include any offensive comments that are
                connected to race, national origin, gender, sexual preference, or
                physical handicap.
              </li>
              <li>
                Your Contributions do not otherwise violate, or link to material
                that violates, any provision of these Terms and Conditions, or any
                applicable law or regulation.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Any use of the Service in violation of the foregoing violates these
              Terms and Conditions and may result in, among other things,
              termination or suspension of your rights to use the Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Contribution License</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              By posting your Contributions to any part of the Service or making
              Contributions accessible to the Service by linking your account from
              the Service to any of your social networking accounts, you
              automatically grant, and you represent and warrant that you have the
              right to grant, to us an unrestricted, unlimited, irrevocable,
              perpetual, non-exclusive, transferable, royalty-free, fully-paid,
              worldwide right, and license to host, use, copy, reproduce,
              disclose, sell, resell, publish, broadcast, retitle, archive, store,
              cache, publicly perform, publicly display, reformat, translate,
              transmit, excerpt (in whole or in part), and distribute such
              Contributions (including, without limitation, your image and voice)
              for any purpose, commercial, advertising, or otherwise, and to
              prepare derivative works of, or incorporate into other works, such
              Contributions, and grant and authorize sublicenses of the foregoing.
            </p>
            <p className="text-muted-foreground">
              The use and distribution may occur in any media formats and through
              any media channels. This license will apply to any form, media, or
              technology now known or hereafter developed, and includes our use of
              your name, company name, and franchise name, as applicable, and any
              of the trademarks, service marks, trade names, logos, and personal
              and commercial images you provide.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Service Management</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We reserve the right, but not the obligation, to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Monitor the Service for violations of these Terms and Conditions.
              </li>
              <li>
                Take appropriate legal action against anyone who, in our sole
                discretion, violates the law or these Terms and Conditions,
                including without limitation, reporting such user to law
                enforcement authorities.
              </li>
              <li>
                In our sole discretion and without limitation, refuse, restrict
                access to, limit the availability of, or disable (to the extent
                technologically feasible) any of your Contributions or any portion
                thereof.
              </li>
              <li>
                In our sole discretion and without limitation, notice, or
                liability, to remove from the Service or otherwise disable all
                files and content that are excessive in size or are in any way
                burdensome to our systems.
              </li>
              <li>
                Otherwise manage the Service in a manner designed to protect our
                rights and property and to facilitate the proper functioning of
                the Service.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Privacy Policy</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We care about data privacy and security. Please review our Privacy
              Policy:{" "}
              <Link
                href="/privacy"
                className="text-primary underline hover:no-underline"
              >
                {marketingSite.url}/privacy
              </Link>
              . By using the Service, you agree to be bound by our Privacy Policy,
              which is incorporated into these Terms and Conditions. Please be
              advised the Service is hosted in the United States.
            </p>
            <p className="text-muted-foreground">
              If you access the Service from any other region of the world with
              laws or other requirements governing personal data collection, use, or
              disclosure that differ from applicable laws in the United States,
              then through your continued use of the Service, you are transferring
              your data to the United States, and you agree to have your data
              transferred to and processed in the United States.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Term and Termination</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These Terms and Conditions shall remain in full force and effect
              while you use the Service. WITHOUT LIMITING ANY OTHER PROVISION OF
              THESE TERMS AND CONDITIONS, WE RESERVE THE RIGHT TO, IN OUR SOLE
              DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE
              OF THE SERVICE (INCLUDING BLOCKING CERTAIN IP ADDRESSES) TO ANY
              PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT
              LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT
              CONTAINED IN THESE TERMS AND CONDITIONS OR OF ANY APPLICABLE LAW OR
              REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE
              SERVICE OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT
              YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
            </p>
            <p className="text-muted-foreground">
              If we terminate or suspend your account for any reason, you are
              prohibited from registering and creating a new account under your
              name, a fake or borrowed name, or the name of any third party, even
              if you may be acting on behalf of the third party. In addition to
              terminating or suspending your account, we reserve the right to take
              appropriate legal action, including without limitation pursuing civil,
              criminal, and injunctive redress.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Modifications and Interruptions</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We reserve the right to change, modify, or remove the contents of
              the Service at any time or for any reason at our sole discretion
              without notice. However, we have no obligation to update any
              information on our Service. We will not be liable to you or any
              third party for any modification, suspension, or discontinuance of
              the Service.
            </p>
            <p className="text-muted-foreground">
              We cannot guarantee the Service will be available at all times. We
              may experience hardware, software, or other problems or need to
              perform maintenance related to the Service, resulting in
              interruptions, delays, or errors. We reserve the right to change,
              revise, update, suspend, discontinue, or otherwise modify the Service
              at any time or for any reason without notice to you.
            </p>
            <p className="text-muted-foreground">
              You agree that we have no liability whatsoever for any loss, damage,
              or inconvenience caused by your inability to access or use the
              Service during any downtime or discontinuance of the Service. Nothing
              in these Terms and Conditions will be construed to obligate us to
              maintain and support the Service or to supply any corrections,
              updates, or releases in connection therewith.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Governing Law</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These Terms and Conditions and your use of the Service are governed
              by and construed in accordance with the laws of the United States
              applicable to agreements made and to be entirely performed within the
              United States, without regard to its conflict of law principles.
            </p>
            <p className="text-muted-foreground">
              Any legal action of whatever nature brought by either you or us
              (collectively, the &quot;Parties&quot; and individually, a
              &quot;Party&quot;) shall be commenced or prosecuted in the state and
              federal courts located in the United States, and the Parties hereby
              consent to, and waive all defenses of lack of personal jurisdiction
              and forum non conveniens with respect to venue and jurisdiction in
              such state and federal courts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Disclaimers</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU
              AGREE THAT YOUR USE OF THE SERVICE WILL BE AT YOUR SOLE RISK. TO THE
              FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS
              OR IMPLIED, IN CONNECTION WITH THE SERVICE AND YOUR USE THEREOF,
              INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE
              ACCURACY OR COMPLETENESS OF THE SERVICE'S CONTENT OR THE CONTENT OF
              ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICE AND WE
              WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS
              </li>
              <li>
                PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER,
                RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICE
              </li>
              <li>
                ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY
                AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED
                THEREIN
              </li>
              <li>
                ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE
                SERVICE
              </li>
              <li>
                ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE
                TRANSMITTED TO OR THROUGH THE SERVICE BY ANY THIRD PARTY
              </li>
              <li>
                ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY
                LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY
                CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE
                SERVICE
              </li>
            </ul>
            <p className="text-muted-foreground">
              WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR
              ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY
              THROUGH THE SERVICE, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR
              MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND
              WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR
              MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS
              OF PRODUCTS OR SERVICES.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Limitations of Liability</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE
              TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL,
              EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST
              PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM
              YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-muted-foreground">
              NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR
              LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM
              OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF
              ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY
              CAUSE OF ACTION ARISING.
            </p>
            <p className="text-muted-foreground">
              CERTAIN STATE LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR
              THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY
              TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT
              APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Indemnification</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You agree to defend, indemnify, and hold us harmless, including our
              subsidiaries, affiliates, and all of our respective officers, agents,
              partners, and employees, from and against any loss, damage,
              liability, claim, or demand, including reasonable attorneys' fees and
              expenses, made by any third party due to or arising out of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your Contributions</li>
              <li>Use of the Service</li>
              <li>
                Breach of these Terms and Conditions
              </li>
              <li>
                Any breach of your representations and warranties set forth in
                these Terms and Conditions
              </li>
              <li>
                Your violation of the rights of a third party, including but not
                limited to intellectual property rights
              </li>
              <li>
                Any overt harmful act toward any other user of the Service with
                whom you connected via the Service
              </li>
            </ul>
            <p className="text-muted-foreground">
              Notwithstanding the foregoing, we reserve the right, at your expense,
              to assume the exclusive defense and control of any matter for which
              you are required to indemnify us, and you agree to cooperate, at your
              expense, with our defense of such claims. We will use reasonable
              efforts to notify you of any such claim, action, or proceeding which
              is subject to this indemnification upon becoming aware of it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">User Data</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We will maintain certain data that you transmit to the Service for
              the purpose of managing the performance of the Service, as well as
              data relating to your use of the Service. Although we perform
              regular routine backups of data, you are solely responsible for all
              data that you transmit or that relates to any activity you have
              undertaken using the Service.
            </p>
            <p className="text-muted-foreground">
              You agree that we shall have no liability to you for any loss or
              corruption of any such data, and you hereby waive any right of action
              against us arising from any such loss or corruption of such data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Electronic Communications, Transactions, and Signatures</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Visiting the Service, sending us emails, and completing online forms
              constitute electronic communications. You consent to receive
              electronic communications, and you agree that all agreements,
              notices, disclosures, and other communications we provide to you
              electronically, via email and on the Service, satisfy any legal
              requirement that such communication be in writing.
            </p>
            <p className="text-muted-foreground">
              YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS,
              ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES,
              POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US
              OR VIA THE SERVICE. You hereby waive any rights or requirements
              under any statutes, regulations, rules, ordinances, or other laws in
              any jurisdiction which require an original signature or delivery or
              retention of non-electronic records, or to payments or the granting
              of credits by any means other than electronic means.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Miscellaneous</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              These Terms and Conditions and any policies or operating rules posted
              by us on the Service or in respect to the Service constitute the
              entire agreement and understanding between you and us. Our failure to
              exercise or enforce any right or provision of these Terms and
              Conditions shall not operate as a waiver of such right or provision.
            </p>
            <p className="text-muted-foreground">
              These Terms and Conditions operate to the fullest extent permissible
              by law. We may assign any or all of our rights and obligations to
              others at any time. We shall not be responsible or liable for any
              loss, damage, delay, or failure to act caused by any cause beyond our
              reasonable control.
            </p>
            <p className="text-muted-foreground">
              If any provision or part of a provision of these Terms and Conditions
              is determined to be unlawful, void, or unenforceable, that provision
              or part of the provision is deemed severable from these Terms and
              Conditions and does not affect the validity and enforceability of any
              remaining provisions.
            </p>
            <p className="text-muted-foreground">
              There is no joint venture, partnership, employment or agency
              relationship created between you and us as a result of these Terms
              and Conditions or use of the Service. You agree that these Terms and
              Conditions will not be construed against us by virtue of having
              drafted them.
            </p>
            <p className="text-muted-foreground">
              You hereby waive any and all defenses you may have based on the
              electronic form of these Terms and Conditions and the lack of
              signing by the parties hereto to execute these Terms and Conditions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">Contact Us</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              In order to resolve a complaint regarding the Service or to receive
              further information regarding use of the Service, please contact us
              at:
            </p>
            <ul className="space-y-2 list-disc pl-6">
              <li>
                <p>
                  By email:{" "}
                  <Link
                    href={`mailto:${marketingSite.contactEmail}`}
                    className="text-primary underline hover:no-underline"
                  >
                    {marketingSite.contactEmail}
                  </Link>
                </p>
              </li>
              <li>
                <p>
                  By visiting this page on our website:{" "}
                  <Link
                    href={marketingSite.url}
                    target="_blank"
                    rel="external nofollow noopener"
                    className="text-primary underline hover:no-underline"
                  >
                    {marketingSite.url}
                  </Link>
                </p>
              </li>
              <li>
                <p>
                  By phone:{" "}
                  <Link
                    href={`tel:${marketingSite.contactPhone.replace(
                      /[^\d+]/g,
                      "",
                    )}`}
                    className="text-primary underline hover:no-underline"
                  >
                    {marketingSite.contactPhone}
                  </Link>
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

