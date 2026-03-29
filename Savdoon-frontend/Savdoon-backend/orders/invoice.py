"""
PDF Invoice Generator for orders.
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from django.conf import settings


def generate_invoice_pdf(order):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', fontSize=20, textColor=colors.HexColor('#6366F1'))
    elements.append(Paragraph(f"Invoice: {order.store.name}", title_style))
    elements.append(Spacer(1, 10*mm))
    
    info = f"Order: {order.order_number}<br/>Date: {order.created_at.strftime('%Y-%m-%d')}<br/>Total: {order.total}"
    elements.append(Paragraph(info, styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def save_invoice_to_order(order):
    from django.core.files.base import ContentFile
    buffer = generate_invoice_pdf(order)
    filename = f"invoice_{order.order_number}.pdf"
    order.invoice_pdf.save(filename, ContentFile(buffer.getvalue()), save=True)
    return order.invoice_pdf.url
