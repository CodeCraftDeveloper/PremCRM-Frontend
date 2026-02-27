import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  Activity,
  MessageSquare,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  fetchWebsite,
  fetchWebsiteStats,
  regenerateApiKey,
  testWebsiteConnection,
  deleteWebsite,
  clearSelectedWebsite,
} from "../../store/slices/websitesSlice";
import { Button, LoadingSpinner, Modal, StatCard } from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const CATEGORY_LABELS = {
  contact_form: "Contact Form",
  landing_page: "Landing Page",
  webinar: "Webinar",
  partner: "Partner",
  other: "Other",
};

const WebsiteDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedWebsite: website, isLoading } = useSelector(
    (state) => state.websites,
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeSnippetLang, setActiveSnippetLang] = useState("javascript");

  useEffect(() => {
    dispatch(fetchWebsite(id));
    dispatch(fetchWebsiteStats(id));
    return () => {
      dispatch(clearSelectedWebsite());
    };
  }, [dispatch, id]);

  const handleRegenerateApiKey = async () => {
    try {
      const result = await dispatch(regenerateApiKey(id)).unwrap();
      setNewApiKey(result?.apiKey || result?.website?.apiKey);
      toast.success("API key regenerated successfully");
      setRegenerateModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to regenerate API key");
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await dispatch(testWebsiteConnection(id)).unwrap();
      toast.success("Webhook connection test successful");
    } catch (error) {
      toast.error(error || "Webhook test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteWebsite(id)).unwrap();
      toast.success("Website deleted successfully");
      navigate("/admin/websites");
    } catch (error) {
      toast.error(error || "Failed to delete website");
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading || !website) {
    return <LoadingSpinner />;
  }

  const apiBaseUrl = (
    import.meta.env.VITE_API_URL || `${window.location.origin}/api`
  ).replace(/\/api.*$/, "");

  const _productsEndpoint = `${apiBaseUrl}/api/public/products`;
  const _formSchemaEndpoint = `${apiBaseUrl}/api/public/form-schema`;
  const hasProducts = website.products && website.products.length > 0;
  const _productsJSON = hasProducts ? JSON.stringify(website.products) : "[]";
  const _hasFormFields = website.formFields && website.formFields.length > 0;

  const integrationSnippets = {
    javascript: {
      label: "JavaScript",
      lang: "html",
      code: `<!-- Lead Form Integration (dynamic form schema + attachments) -->
<script>
  const API_BASE = '${apiBaseUrl}';
  const API_KEY  = 'YOUR_API_KEY';

  // 1. Load form schema (products + custom fields)
  async function loadFormSchema() {
    try {
      const res = await fetch(API_BASE + '/api/public/form-schema', {
        headers: { 'x-api-key': API_KEY }
      });
      const { data } = await res.json();

      // Populate product dropdown
      const select = document.getElementById('productInterest');
      if (select && data.products?.length) {
        select.innerHTML = '<option value="">-- Select Product --</option>';
        data.products.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p; opt.textContent = p;
          select.appendChild(opt);
        });
      }

      // Render custom fields into a container
      const container = document.getElementById('customFieldsContainer');
      if (container && data.formFields?.length) {
        container.innerHTML = '';
        data.formFields.forEach(f => {
          const wrapper = document.createElement('div');
          wrapper.style.cssText = f.width === 'half' ? 'display:inline-block;width:48%;margin-right:2%' : 'width:100%';
          wrapper.style.marginBottom = '12px';

          const label = document.createElement('label');
          label.textContent = f.label + (f.required ? ' *' : '');
          label.style.cssText = 'display:block;margin-bottom:4px;font-weight:500;font-size:14px';
          wrapper.appendChild(label);

          let input;
          if (f.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
          } else if (f.type === 'select' && f.options?.length) {
            input = document.createElement('select');
            const blank = document.createElement('option');
            blank.value = ''; blank.textContent = '-- Select --';
            input.appendChild(blank);
            f.options.forEach(o => {
              const opt = document.createElement('option');
              opt.value = o; opt.textContent = o;
              input.appendChild(opt);
            });
          } else if (f.type === 'radio' && f.options?.length) {
            input = document.createElement('div');
            f.options.forEach(o => {
              const lbl = document.createElement('label');
              lbl.style.cssText = 'margin-right:12px;font-size:14px';
              const rb = document.createElement('input');
              rb.type = 'radio'; rb.name = 'custom_' + f.fieldName; rb.value = o;
              lbl.appendChild(rb); lbl.append(' ' + o);
              input.appendChild(lbl);
            });
          } else if (f.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
          } else if (f.type === 'file') {
            input = document.createElement('input');
            input.type = 'file';
          } else if (f.type === 'date') {
            input = document.createElement('input');
            input.type = 'date';
          } else {
            input = document.createElement('input');
            input.type = f.type === 'email' ? 'email'
              : f.type === 'number' ? 'number'
              : f.type === 'url' ? 'url'
              : f.type === 'phone' ? 'tel' : 'text';
          }

          if (input.tagName !== 'DIV') {
            input.name = 'custom_' + f.fieldName;
            input.placeholder = f.placeholder || '';
            if (f.required) input.required = true;
            input.style.cssText = 'width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:14px';
          }
          wrapper.appendChild(input);
          container.appendChild(wrapper);
        });
      }
    } catch (err) { console.error('Failed to load form schema:', err); }
  }

  // 2. Submit the lead (gathers custom fields automatically)
  async function submitLead(formValues, fileInputId = 'attachments') {
    const payload = new FormData();
    payload.append('firstName', formValues.firstName || '');
    payload.append('lastName', formValues.lastName || '');
    payload.append('email', formValues.email || '');
    payload.append('phone', formValues.phone || '');
    payload.append('message', formValues.message || '');
    payload.append('company', formValues.company || '');
    payload.append('productInterest', formValues.productInterest || '');
    payload.append('source', '${website.name}');

    // Collect custom fields
    const customFields = {};
    document.querySelectorAll('#customFieldsContainer [name^="custom_"]').forEach(el => {
      const key = el.name.replace('custom_', '');
      if (el.type === 'checkbox') customFields[key] = el.checked;
      else if (el.type === 'radio') { if (el.checked) customFields[key] = el.value; }
      else if (el.type === 'file') { /* handled separately */ }
      else customFields[key] = el.value;
    });
    payload.append('customFields', JSON.stringify(customFields));

    const fileInput = document.getElementById(fileInputId);
    if (fileInput?.files?.length) {
      Array.from(fileInput.files)
        .slice(0, 5)
        .forEach((file) => payload.append('attachments', file));
    }

    const response = await fetch(API_BASE + '/api/public/lead', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: payload
    });
    return response.json();
  }

  document.addEventListener('DOMContentLoaded', loadFormSchema);
<\\/script>

<!-- Example HTML -->
<!--
  <select id="productInterest"><option>Loading...</option></select>
  <input name="firstName" />
  <input name="email" />
  <div id="customFieldsContainer"></div>
  <input type="file" id="attachments" multiple />
  <button onclick="submitLead({
    firstName: document.querySelector('[name=firstName]').value,
    email: document.querySelector('[name=email]').value,
    productInterest: document.getElementById('productInterest').value
  })">Submit</button>
-->`,
    },
    react: {
      label: "React / Next.js",
      lang: "jsx",
      code: `import { useState, useEffect } from 'react';

const API_URL = '${apiBaseUrl}/api/public/lead';
const SCHEMA_URL = '${apiBaseUrl}/api/public/form-schema';
const API_KEY = 'YOUR_API_KEY';

export default function LeadForm() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', message: '', company: '', productInterest: ''
  });
  const [customValues, setCustomValues] = useState({});
  const [files, setFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch form schema (products + custom fields) on mount
  useEffect(() => {
    fetch(SCHEMA_URL, { headers: { 'x-api-key': API_KEY } })
      .then(res => res.json())
      .then(({ data }) => {
        setProducts(data.products || []);
        setFormFields(data.formFields || []);
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCustomChange = (fieldName, value) =>
    setCustomValues((prev) => ({ ...prev, [fieldName]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      payload.append('source', '${website.name}');
      payload.append('customFields', JSON.stringify(customValues));
      files.slice(0, 5).forEach((f) => payload.append('attachments', f));

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: payload,
      });
      setResult(await res.json());
    } catch (err) {
      console.error('Lead submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field) => {
    const { fieldName, label, type, placeholder, required, options, width } = field;
    const style = width === 'half' ? { display: 'inline-block', width: '48%', marginRight: '2%' } : {};

    switch (type) {
      case 'textarea':
        return (
          <div key={fieldName} style={style}>
            <label>{label}{required && ' *'}</label>
            <textarea placeholder={placeholder}
              onChange={(e) => handleCustomChange(fieldName, e.target.value)} />
          </div>
        );
      case 'select':
        return (
          <div key={fieldName} style={style}>
            <label>{label}{required && ' *'}</label>
            <select onChange={(e) => handleCustomChange(fieldName, e.target.value)}>
              <option value="">-- Select --</option>
              {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        );
      case 'radio':
        return (
          <div key={fieldName} style={style}>
            <label>{label}{required && ' *'}</label>
            {(options || []).map(o => (
              <label key={o} style={{ marginRight: 12 }}>
                <input type="radio" name={fieldName} value={o}
                  onChange={(e) => handleCustomChange(fieldName, e.target.value)} /> {o}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div key={fieldName} style={style}>
            <label>
              <input type="checkbox"
                onChange={(e) => handleCustomChange(fieldName, e.target.checked)} /> {label}
            </label>
          </div>
        );
      case 'file':
        return (
          <div key={fieldName} style={style}>
            <label>{label}{required && ' *'}</label>
            <input type="file"
              onChange={(e) => handleCustomChange(fieldName, e.target.files[0]?.name)} />
          </div>
        );
      default:
        return (
          <div key={fieldName} style={style}>
            <label>{label}{required && ' *'}</label>
            <input type={type === 'phone' ? 'tel' : type}
              placeholder={placeholder}
              onChange={(e) => handleCustomChange(fieldName, e.target.value)} />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstName" placeholder="First Name" onChange={handleChange} />
      <input name="lastName" placeholder="Last Name" onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} />
      <input name="phone" placeholder="Phone" onChange={handleChange} />
      <input name="company" placeholder="Company" onChange={handleChange} />

      {/* Product Interest dropdown */}
      {products.length > 0 && (
        <select name="productInterest" value={form.productInterest} onChange={handleChange}>
          <option value="">-- Select Product --</option>
          {products.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}

      <textarea name="message" placeholder="Message" onChange={handleChange} />

      {/* Dynamic custom fields from CRM */}
      {formFields.map(renderCustomField)}

      <input type="file" multiple
        onChange={(e) => setFiles(Array.from(e.target.files))} />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending...' : 'Submit'}
      </button>
      {result && <p>Lead submitted successfully!</p>}
    </form>
  );
}`,
    },
    php: {
      label: "PHP (cURL)",
      lang: "php",
      code: `<?php
$apiUrl      = '${apiBaseUrl}/api/public/lead';
$schemaUrl   = '${apiBaseUrl}/api/public/form-schema';
$apiKey      = 'YOUR_API_KEY';

// ---------- Fetch Form Schema (products + custom fields) ----------
function getFormSchema($schemaUrl, $apiKey) {
    $ch = curl_init($schemaUrl);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => ["x-api-key: $apiKey"],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return [
        'products'   => $res['data']['products'] ?? [],
        'formFields' => $res['data']['formFields'] ?? [],
    ];
}

$schema    = getFormSchema($schemaUrl, $apiKey);
$products  = $schema['products'];
$formFields = $schema['formFields'];

// Use in your HTML:
// <select name="productInterest">
//   <option value="">-- Select Product --</option>
//   <?php foreach ($products as $p): ?>
//     <option value="<?= htmlspecialchars($p) ?>"><?= htmlspecialchars($p) ?></option>
//   <?php endforeach; ?>
// </select>
//
// <!-- Custom fields rendered dynamically -->
// <?php foreach ($formFields as $f): ?>
//   <label><?= htmlspecialchars($f['label']) ?><?= $f['required'] ? ' *' : '' ?></label>
//   <?php if ($f['type'] === 'select'): ?>
//     <select name="custom_<?= $f['fieldName'] ?>">
//       <option value="">-- Select --</option>
//       <?php foreach ($f['options'] as $opt): ?>
//         <option value="<?= htmlspecialchars($opt) ?>"><?= htmlspecialchars($opt) ?></option>
//       <?php endforeach; ?>
//     </select>
//   <?php elseif ($f['type'] === 'textarea'): ?>
//     <textarea name="custom_<?= $f['fieldName'] ?>" placeholder="<?= htmlspecialchars($f['placeholder'] ?? '') ?>"></textarea>
//   <?php else: ?>
//     <input type="<?= $f['type'] === 'phone' ? 'tel' : $f['type'] ?>"
//            name="custom_<?= $f['fieldName'] ?>"
//            placeholder="<?= htmlspecialchars($f['placeholder'] ?? '') ?>" />
//   <?php endif; ?>
// <?php endforeach; ?>

// ---------- Submit Lead ----------
$fields = [
    'firstName'       => $_POST['firstName'] ?? '',
    'lastName'        => $_POST['lastName'] ?? '',
    'email'           => $_POST['email'] ?? '',
    'phone'           => $_POST['phone'] ?? '',
    'message'         => $_POST['message'] ?? '',
    'company'         => $_POST['company'] ?? '',
    'productInterest' => $_POST['productInterest'] ?? '',
    'source'          => '${website.name}',
];

// Collect custom field values
$customFields = [];
foreach ($formFields as $f) {
    $key = 'custom_' . $f['fieldName'];
    if (isset($_POST[$key])) {
        $customFields[$f['fieldName']] = $_POST[$key];
    }
}
$fields['customFields'] = json_encode($customFields);

// Handle file attachments (max 5)
$attachments = [];
if (!empty($_FILES['attachments']['name'][0])) {
    $count = min(count($_FILES['attachments']['name']), 5);
    for ($i = 0; $i < $count; $i++) {
        $attachments[] = new CURLFile(
            $_FILES['attachments']['tmp_name'][$i],
            $_FILES['attachments']['type'][$i],
            $_FILES['attachments']['name'][$i]
        );
    }
}

$postFields = $fields;
foreach ($attachments as $idx => $file) {
    $postFields["attachments[$idx]"] = $file;
}

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $postFields,
    CURLOPT_HTTPHEADER     => ["x-api-key: $apiKey"],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
echo $httpCode === 201 ? 'Lead created!' : 'Error: ' . ($result['message'] ?? 'Unknown');
?>`,
    },
    python: {
      label: "Python",
      lang: "python",
      code: `import requests, json

API_URL      = '${apiBaseUrl}/api/public/lead'
SCHEMA_URL   = '${apiBaseUrl}/api/public/form-schema'
API_KEY      = 'YOUR_API_KEY'
HEADERS      = {'x-api-key': API_KEY}


def get_form_schema() -> dict:
    """Fetch form schema: products + custom field definitions."""
    res = requests.get(SCHEMA_URL, headers=HEADERS)
    res.raise_for_status()
    data = res.json().get('data', {})
    return {
        'products':   data.get('products', []),
        'formFields': data.get('formFields', []),
    }


def submit_lead(form_data: dict, custom_fields: dict = None,
                file_paths: list[str] | None = None):
    """
    Submit a lead to the CRM.

    form_data keys: firstName, lastName, email, phone,
                    message, company, productInterest
    custom_fields:  dict of custom field values keyed by fieldName
    file_paths:     list of local file paths (max 5)
    """
    payload = {
        'firstName':       form_data.get('firstName', ''),
        'lastName':        form_data.get('lastName', ''),
        'email':           form_data.get('email', ''),
        'phone':           form_data.get('phone', ''),
        'message':         form_data.get('message', ''),
        'company':         form_data.get('company', ''),
        'productInterest': form_data.get('productInterest', ''),
        'source':          '${website.name}',
    }

    if custom_fields:
        payload['customFields'] = json.dumps(custom_fields)

    files = []
    if file_paths:
        for path in file_paths[:5]:
            files.append(('attachments', open(path, 'rb')))

    response = requests.post(
        API_URL, data=payload,
        files=files or None,
        headers=HEADERS,
    )
    for _, f in files:
        f.close()

    response.raise_for_status()
    return response.json()


# Example usage:
schema = get_form_schema()
print('Products:', schema['products'])
print('Custom fields:', [f['label'] for f in schema['formFields']])

result = submit_lead(
    {'firstName': 'John', 'email': 'john@example.com',
     'productInterest': schema['products'][0] if schema['products'] else ''},
    custom_fields={'company_address': '123 Main St'},
    file_paths=['./brochure.pdf'],
)
print(result)`,
    },
    curl: {
      label: "cURL",
      lang: "bash",
      code: `# ---------- 1. Fetch form schema (products + custom fields) ----------
curl -s '${apiBaseUrl}/api/public/form-schema' \\
  -H 'x-api-key: YOUR_API_KEY' | jq '.data'

# Example response:
# {
#   "products": ["Enterprise Plan", "Starter Plan"],
#   "formFields": [
#     { "fieldName": "company_address", "label": "Company Address",
#       "type": "text", "required": true, "width": "full" },
#     { "fieldName": "budget_range", "label": "Budget Range",
#       "type": "select", "options": ["<10k", "10k-50k", ">50k"] }
#   ]
# }

# ---------- 2. Submit a lead with custom fields ----------
curl -X POST '${apiBaseUrl}/api/public/lead' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -F 'firstName=John' \\
  -F 'lastName=Doe' \\
  -F 'email=john@example.com' \\
  -F 'phone=+919876543210' \\
  -F 'message=Interested in your product' \\
  -F 'company=Acme Inc' \\
  -F 'productInterest=Enterprise Plan' \\
  -F 'source=${website.name}' \\
  -F 'customFields={"company_address":"123 Main St","budget_range":"10k-50k"}' \\
  -F 'attachments=@/path/to/file1.pdf' \\
  -F 'attachments=@/path/to/file2.pdf'`,
    },
    csharp: {
      label: "C# / .NET",
      lang: "csharp",
      code: `using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

var apiUrl    = "${apiBaseUrl}/api/public/lead";
var schemaUrl = "${apiBaseUrl}/api/public/form-schema";
var apiKey    = "YOUR_API_KEY";

// ---------- Fetch Form Schema ----------
async Task<(List<string> Products, JsonElement FormFields)> GetFormSchemaAsync()
{
    using var client = new HttpClient();
    client.DefaultRequestHeaders.Add("x-api-key", apiKey);
    var json = await client.GetStringAsync(schemaUrl);
    var doc  = JsonDocument.Parse(json);
    var data = doc.RootElement.GetProperty("data");

    var products = data.GetProperty("products")
        .EnumerateArray().Select(e => e.GetString()!).ToList();
    var formFields = data.GetProperty("formFields");

    return (products, formFields);
}

// ---------- Submit Lead ----------
async Task<string> SubmitLeadAsync(
    Dictionary<string, string> formData,
    Dictionary<string, string>? customFields = null,
    List<string>? filePaths = null)
{
    using var client = new HttpClient();
    using var content = new MultipartFormDataContent();

    content.Add(new StringContent(formData.GetValueOrDefault("firstName", "")), "firstName");
    content.Add(new StringContent(formData.GetValueOrDefault("lastName", "")),  "lastName");
    content.Add(new StringContent(formData.GetValueOrDefault("email", "")),     "email");
    content.Add(new StringContent(formData.GetValueOrDefault("phone", "")),     "phone");
    content.Add(new StringContent(formData.GetValueOrDefault("message", "")),   "message");
    content.Add(new StringContent(formData.GetValueOrDefault("company", "")),   "company");
    content.Add(new StringContent(
        formData.GetValueOrDefault("productInterest", "")), "productInterest");
    content.Add(new StringContent("${website.name}"), "source");

    if (customFields is not null)
    {
        var cf = JsonSerializer.Serialize(customFields);
        content.Add(new StringContent(cf), "customFields");
    }

    if (filePaths is not null)
    {
        foreach (var path in filePaths.Take(5))
        {
            var stream = File.OpenRead(path);
            var fileContent = new StreamContent(stream);
            fileContent.Headers.ContentType =
                new MediaTypeHeaderValue("application/octet-stream");
            content.Add(fileContent, "attachments", Path.GetFileName(path));
        }
    }

    client.DefaultRequestHeaders.Add("x-api-key", apiKey);
    var response = await client.PostAsync(apiUrl, content);
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadAsStringAsync();
}

// Example:
var (products, formFields) = await GetFormSchemaAsync();
Console.WriteLine("Products: " + string.Join(", ", products));
Console.WriteLine("Custom fields: " + formFields.GetArrayLength() + " defined");

var result = await SubmitLeadAsync(
    new Dictionary<string, string>
    {
        ["firstName"]       = "John",
        ["email"]           = "john@example.com",
        ["productInterest"] = products.FirstOrDefault() ?? ""
    },
    new Dictionary<string, string>
    {
        ["company_address"] = "123 Main St"
    }
);
Console.WriteLine(result);`,
    },
    jquery: {
      label: "jQuery",
      lang: "html",
      code: `<!-- Lead Form Integration (jQuery + dynamic form schema) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"><\\/script>
<script>
  var API_BASE = '${apiBaseUrl}';
  var API_KEY  = 'YOUR_API_KEY';
  var _formFields = []; // store for submit

  // Load form schema: products + custom fields
  $(function() {
    $.ajax({
      url: API_BASE + '/api/public/form-schema',
      headers: { 'x-api-key': API_KEY },
      success: function(res) {
        var data = res.data || {};

        // Products dropdown
        var $sel = $('#productInterest');
        $sel.html('<option value="">-- Select Product --</option>');
        $.each(data.products || [], function(_, p) {
          $sel.append('<option value="' + p + '">' + p + '</option>');
        });

        // Render custom fields
        _formFields = data.formFields || [];
        var $container = $('#customFieldsContainer');
        $.each(_formFields, function(_, f) {
          var html = '<div style="margin-bottom:12px;'
            + (f.width === 'half' ? 'display:inline-block;width:48%;margin-right:2%' : 'width:100%')
            + '">';
          html += '<label style="display:block;margin-bottom:4px;font-weight:500">'
            + f.label + (f.required ? ' *' : '') + '</label>';

          if (f.type === 'textarea') {
            html += '<textarea name="custom_' + f.fieldName + '" rows="3" placeholder="'
              + (f.placeholder || '') + '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px"><\\/textarea>';
          } else if (f.type === 'select' && f.options && f.options.length) {
            html += '<select name="custom_' + f.fieldName + '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px">';
            html += '<option value="">-- Select --</option>';
            $.each(f.options, function(_, o) {
              html += '<option value="' + o + '">' + o + '</option>';
            });
            html += '</select>';
          } else if (f.type === 'checkbox') {
            html += '<input type="checkbox" name="custom_' + f.fieldName + '" />';
          } else {
            var inputType = f.type === 'phone' ? 'tel' : (f.type === 'date' ? 'date' : f.type);
            html += '<input type="' + inputType + '" name="custom_' + f.fieldName
              + '" placeholder="' + (f.placeholder || '')
              + '" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px" />';
          }
          html += '</div>';
          $container.append(html);
        });
      }
    });
  });

  function submitLead() {
    var formData = new FormData();
    formData.append('firstName', $('input[name="firstName"]').val() || '');
    formData.append('lastName',  $('input[name="lastName"]').val()  || '');
    formData.append('email',     $('input[name="email"]').val()     || '');
    formData.append('phone',     $('input[name="phone"]').val()     || '');
    formData.append('message',   $('textarea[name="message"]').val() || '');
    formData.append('company',   $('input[name="company"]').val()   || '');
    formData.append('productInterest', $('#productInterest').val() || '');
    formData.append('source', '${website.name}');

    // Collect custom field values
    var customFields = {};
    $('[name^="custom_"]').each(function() {
      var key = this.name.replace('custom_', '');
      if (this.type === 'checkbox') customFields[key] = this.checked;
      else customFields[key] = $(this).val();
    });
    formData.append('customFields', JSON.stringify(customFields));

    var files = $('#attachments')[0].files;
    $.each(Array.from(files).slice(0, 5), function(_, file) {
      formData.append('attachments', file);
    });

    $.ajax({
      url: API_BASE + '/api/public/lead',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      headers: { 'x-api-key': API_KEY },
      success: function(res) {
        alert('Lead submitted successfully!');
        console.log(res);
      },
      error: function(xhr) {
        alert('Error: ' + (xhr.responseJSON?.message || 'Unknown error'));
      }
    });
  }
<\\/script>

<!-- Example HTML -->
<!--
  <select id="productInterest"><option>Loading...</option></select>
  <input name="firstName" />
  <input name="email" />
  <div id="customFieldsContainer"></div>
  <input type="file" id="attachments" multiple />
  <button onclick="submitLead()">Submit</button>
-->`,
    },
    wordpress: {
      label: "WordPress",
      lang: "php",
      code: `<?php
/**
 * WordPress Lead Form Shortcode (dynamic form schema)
 * Usage: [lead_form]
 * Add this to your theme's functions.php or a custom plugin.
 */

add_shortcode('lead_form', 'render_lead_form');

function render_lead_form() {
    $schemaUrl = '${apiBaseUrl}/api/public/form-schema';
    $apiKey    = 'YOUR_API_KEY';

    // Fetch full form schema
    $ch = curl_init($schemaUrl);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => ["x-api-key: $apiKey"],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    $products   = $res['data']['products'] ?? [];
    $formFields = $res['data']['formFields'] ?? [];

    ob_start();
    ?>
    <form id="crm-lead-form" enctype="multipart/form-data">
      <input name="firstName" placeholder="First Name" required />
      <input name="lastName"  placeholder="Last Name" />
      <input name="email" type="email" placeholder="Email" required />
      <input name="phone"   placeholder="Phone" />
      <input name="company" placeholder="Company" />

      <?php if (!empty($products)): ?>
      <select name="productInterest">
        <option value="">-- Select Product --</option>
        <?php foreach ($products as $p): ?>
          <option value="<?= htmlspecialchars($p) ?>"><?= htmlspecialchars($p) ?></option>
        <?php endforeach; ?>
      </select>
      <?php else: ?>
      <input name="productInterest" placeholder="Product Interest" />
      <?php endif; ?>

      <textarea name="message" placeholder="Message"></textarea>

      <!-- Dynamic custom fields from CRM -->
      <?php foreach ($formFields as $f): ?>
        <div style="margin-bottom:12px;<?= $f['width'] === 'half' ? 'display:inline-block;width:48%;margin-right:2%' : 'width:100%' ?>">
          <label style="display:block;margin-bottom:4px;font-weight:500">
            <?= htmlspecialchars($f['label']) ?><?= $f['required'] ? ' *' : '' ?>
          </label>
          <?php if ($f['type'] === 'select' && !empty($f['options'])): ?>
            <select name="custom_<?= $f['fieldName'] ?>" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px">
              <option value="">-- Select --</option>
              <?php foreach ($f['options'] as $opt): ?>
                <option value="<?= htmlspecialchars($opt) ?>"><?= htmlspecialchars($opt) ?></option>
              <?php endforeach; ?>
            </select>
          <?php elseif ($f['type'] === 'textarea'): ?>
            <textarea name="custom_<?= $f['fieldName'] ?>" rows="3"
              placeholder="<?= htmlspecialchars($f['placeholder'] ?? '') ?>"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px"
              <?= $f['required'] ? 'required' : '' ?>></textarea>
          <?php elseif ($f['type'] === 'checkbox'): ?>
            <input type="checkbox" name="custom_<?= $f['fieldName'] ?>" />
          <?php elseif ($f['type'] === 'radio' && !empty($f['options'])): ?>
            <?php foreach ($f['options'] as $opt): ?>
              <label style="margin-right:12px">
                <input type="radio" name="custom_<?= $f['fieldName'] ?>"
                  value="<?= htmlspecialchars($opt) ?>" /> <?= htmlspecialchars($opt) ?>
              </label>
            <?php endforeach; ?>
          <?php elseif ($f['type'] === 'file'): ?>
            <input type="file" name="custom_<?= $f['fieldName'] ?>" />
          <?php else: ?>
            <input type="<?= $f['type'] === 'phone' ? 'tel' : ($f['type'] === 'date' ? 'date' : 'text') ?>"
              name="custom_<?= $f['fieldName'] ?>"
              placeholder="<?= htmlspecialchars($f['placeholder'] ?? '') ?>"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px"
              <?= $f['required'] ? 'required' : '' ?> />
          <?php endif; ?>
        </div>
      <?php endforeach; ?>

      <input type="file" name="attachments[]" multiple />
      <button type="submit">Submit</button>
      <p id="crm-lead-msg" style="display:none;"></p>
    </form>
    <script>
      document.getElementById('crm-lead-form')
        .addEventListener('submit', async function(e) {
          e.preventDefault();
          var fd = new FormData(this);
          fd.append('source', '${website.name}');

          // Collect custom fields into a JSON object
          var customFields = {};
          this.querySelectorAll('[name^="custom_"]').forEach(function(el) {
            var key = el.name.replace('custom_', '');
            if (el.type === 'checkbox') customFields[key] = el.checked;
            else if (el.type === 'radio') { if (el.checked) customFields[key] = el.value; }
            else if (el.type !== 'file') customFields[key] = el.value;
            fd.delete(el.name);
          });
          fd.append('customFields', JSON.stringify(customFields));

          var files = this.querySelector('[name="attachments[]"]').files;
          fd.delete('attachments[]');
          Array.from(files).slice(0,5).forEach(f => fd.append('attachments', f));

          try {
            var res = await fetch('${apiBaseUrl}/api/public/lead', {
              method: 'POST',
              headers: { 'x-api-key': '<?= $apiKey ?>' },
              body: fd
            });
            var data = await res.json();
            var msg = document.getElementById('crm-lead-msg');
            msg.style.display = 'block';
            msg.textContent = res.ok ? 'Thank you! We will contact you soon.'
                                     : ('Error: ' + (data.message || 'Unknown'));
          } catch(err) {
            console.error(err);
          }
        });
    <\\/script>
    <?php
    return ob_get_clean();
}
?>`,
    },
  };

  const activeSnippet = integrationSnippets[activeSnippetLang];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/websites"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                website.isActive
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Globe
                className={`h-6 w-6 ${
                  website.isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {website.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {website.domain} •{" "}
                {website.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-500">Inactive</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/queries/${id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              View Queries
            </Button>
          </Link>
          <Link to={`/admin/websites/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={website.stats?.totalLeads || 0}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={website.stats?.leadsThisMonth || 0}
          icon={Zap}
          color="green"
        />
        <StatCard
          title="Duplicates"
          value={website.stats?.duplicatesDetected || 0}
          icon={Shield}
          color="amber"
        />
        <StatCard
          title="Rate Limit"
          value={`${website.rateLimit?.requestsPerMinute || 60}/min`}
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Website Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Website Details
          </h2>
          <div className="space-y-4">
            <DetailRow label="Name" value={website.name} />
            <DetailRow label="Domain" value={website.domain} />
            <DetailRow
              label="Category"
              value={CATEGORY_LABELS[website.category] || website.category}
            />
            <DetailRow label="Description" value={website.description || "—"} />
            <DetailRow
              label="Created"
              value={
                website.createdAt
                  ? format(new Date(website.createdAt), "MMM dd, yyyy")
                  : "—"
              }
            />
            <DetailRow
              label="Last Lead"
              value={
                website.stats?.lastLeadAt
                  ? format(
                      new Date(website.stats.lastLeadAt),
                      "MMM dd, yyyy hh:mm a",
                    )
                  : "No leads yet"
              }
            />
          </div>

          {/* Products / Services */}
          {website.products && website.products.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Products / Services ({website.products.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {website.products.map((product, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Form Fields */}
          {website.formFields && website.formFields.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Custom Form Fields (
                {website.formFields.filter((f) => f.isActive !== false).length}{" "}
                active)
              </h3>
              <div className="space-y-2">
                {website.formFields
                  .filter((f) => f.isActive !== false)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5 dark:bg-gray-700/50"
                    >
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {field.type}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="text-xs font-bold text-red-500">
                          *
                        </span>
                      )}
                      <span className="ml-auto text-xs text-gray-400">
                        {field.width === "half" ? "½ width" : "full"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* API Key Management */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Key className="h-5 w-5 text-amber-500" />
            API Key
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                API Key Prefix
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-gray-100 px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:text-gray-200">
                  {website.apiKeyPrefix || "••••••••"}...
                </code>
              </div>
            </div>

            {newApiKey && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  New API Key (save it now — it won't be shown again):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-xs font-mono dark:bg-gray-800 dark:text-gray-200">
                    {showApiKey ? newApiKey : "•".repeat(40)}
                  </code>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="rounded p-1.5 text-gray-400 hover:text-gray-600"
                    title={showApiKey ? "Hide" : "Show"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(newApiKey, "API Key")}
                    className="rounded p-1.5 text-gray-400 hover:text-gray-600"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateModalOpen(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate API Key
            </Button>
          </div>

          {/* Duplicate Settings */}
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Duplicate Detection
            </h3>
            <div className="space-y-2">
              <SettingRow
                label="Check Email"
                enabled={website.duplicateSettings?.checkEmail}
              />
              <SettingRow
                label="Check Phone"
                enabled={website.duplicateSettings?.checkPhone}
              />
              <SettingRow
                label="Check Name + Email"
                enabled={website.duplicateSettings?.checkNameEmail}
              />
            </div>
          </div>

          {/* Webhook */}
          {website.webhookUrl && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Webhook
              </h3>
              <p className="mb-2 break-all text-sm text-gray-600 dark:text-gray-300">
                {website.webhookUrl}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          )}

          {/* IP Whitelist */}
          {website.ipWhitelist && website.ipWhitelist.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                IP Whitelist
              </h3>
              <div className="flex flex-wrap gap-2">
                {website.ipWhitelist.map((ip, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Code Snippet */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Integration Code
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleCopyToClipboard(
                activeSnippet.code,
                `${activeSnippet.label} snippet`,
              )
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </Button>
        </div>

        {/* Language Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-gray-200 pb-3 dark:border-gray-700">
          {Object.entries(integrationSnippets).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveSnippetLang(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSnippetLang === key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <pre className="mt-3 max-h-[500px] overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>

      {/* Regenerate API Key Modal */}
      <Modal
        isOpen={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        title="Regenerate API Key"
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> Regenerating the API key will immediately
            invalidate the current key. Any integrations using the old key will
            stop working.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setRegenerateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRegenerateApiKey}>
            Regenerate Key
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Website"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{website.name}</strong>? This
          will disable lead collection from this source. Existing leads will NOT
          be deleted.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
  </div>
);

const SettingRow = ({ label, enabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
    {enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )}
  </div>
);

export default WebsiteDetail;
